# AWS Deployment Guide for StoryMine

**Version:** 3.0.0  
**Target:** Production-ready StoryMine with StoryMap Intelligence integration  
**AWS Services:** ECS Fargate, RDS PostgreSQL, S3, CloudFront, ALB

## Overview

This guide details deploying StoryMine to AWS using a containerized architecture that leverages your existing Docker setup and integrates with your AWS-based StoryMap pipeline.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        AWS Production Architecture               │
├─────────────────────────────────────────────────────────────────┤
│  CloudFront CDN          │  Route 53 DNS                        │
│  - Static assets         │  - yourdomain.com                     │
│  - Global distribution   │  - SSL/TLS termination                │
├─────────────────────────────────────────────────────────────────┤
│               Application Load Balancer (ALB)                   │
│               - SSL termination                                  │
│               - Health checks                                    │
│               - Path-based routing                               │
├─────────────────────────────────────────────────────────────────┤
│  ECS Fargate Cluster                                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Frontend Task   │  │ Backend Task    │  │ Import Task     │ │
│  │ - Next.js       │  │ - Node.js API   │  │ - Intelligence  │ │
│  │ - Port 3000     │  │ - Port 3001     │  │   Data Import   │ │
│  │ - Auto-scaling  │  │ - Auto-scaling  │  │ - Scheduled     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  Data & Storage Layer                                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ RDS PostgreSQL  │  │ ElastiCache     │  │ S3 Buckets      │ │
│  │ - Intelligence  │  │ - Redis cache   │  │ - Intelligence  │ │
│  │   data storage  │  │ - Session cache │  │   data files    │ │
│  │ - Multi-AZ      │  │ - Cluster mode  │  │ - Static assets │ │
│  │ - Automated     │  │                 │  │ - Backups       │ │
│  │   backups       │  │                 │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  Monitoring & Security                                          │
│  │ CloudWatch │ AWS Secrets │ VPC │ Security Groups │ IAM │    │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

- AWS CLI configured with appropriate permissions
- Docker images built and ready
- Domain name configured in Route 53
- StoryMap Intelligence data available in S3

## Step 1: Infrastructure Setup

### 1.1 VPC and Networking

```bash
# Create VPC with public and private subnets
aws cloudformation deploy \
  --template-file infrastructure/vpc-template.yaml \
  --stack-name storymine-vpc \
  --parameter-overrides \
    EnvironmentName=production \
    VpcCIDR=10.0.0.0/16 \
    PublicSubnet1CIDR=10.0.1.0/24 \
    PublicSubnet2CIDR=10.0.2.0/24 \
    PrivateSubnet1CIDR=10.0.3.0/24 \
    PrivateSubnet2CIDR=10.0.4.0/24
```

### 1.2 RDS PostgreSQL Database

```bash
# Create RDS instance optimized for Intelligence data
aws rds create-db-instance \
  --db-instance-identifier storymine-production \
  --db-instance-class db.r5.xlarge \
  --engine postgres \
  --engine-version 14.9 \
  --allocated-storage 500 \
  --storage-type gp3 \
  --storage-encrypted \
  --db-name storymine \
  --master-username storymine_admin \
  --master-user-password $(aws secretsmanager get-secret-value --secret-id storymine/db/password --query SecretString --output text) \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name storymine-db-subnet-group \
  --backup-retention-period 7 \
  --multi-az \
  --deletion-protection \
  --enable-performance-insights \
  --performance-insights-retention-period 7
```

### 1.3 ElastiCache Redis

```bash
# Create Redis cluster for caching
aws elasticache create-replication-group \
  --replication-group-id storymine-cache \
  --description "StoryMine Redis Cache" \
  --cache-node-type cache.r6g.large \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-clusters 2 \
  --cache-subnet-group-name storymine-cache-subnet-group \
  --security-group-ids sg-xxxxxxxxx \
  --at-rest-encryption-enabled \
  --transit-encryption-enabled
```

## Step 2: Container Registry Setup

### 2.1 Create ECR Repositories

```bash
# Create repositories for each service
aws ecr create-repository --repository-name storymine/frontend
aws ecr create-repository --repository-name storymine/backend
aws ecr create-repository --repository-name storymine/intelligence-import
```

### 2.2 Build and Push Docker Images

```bash
# Get ECR login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and tag images
docker build -t storymine/frontend ./src/frontend
docker build -t storymine/backend ./src/backend
docker build -t storymine/intelligence-import -f ./src/backend/Dockerfile.import ./src/backend

# Tag for ECR
docker tag storymine/frontend:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/storymine/frontend:latest
docker tag storymine/backend:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/storymine/backend:latest
docker tag storymine/intelligence-import:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/storymine/intelligence-import:latest

# Push images
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/storymine/frontend:latest
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/storymine/backend:latest
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/storymine/intelligence-import:latest
```

## Step 3: Secrets Management

### 3.1 Store Secrets in AWS Secrets Manager

```bash
# Database credentials
aws secretsmanager create-secret \
  --name storymine/production/database \
  --description "StoryMine production database credentials" \
  --secret-string '{"username":"storymine_admin","password":"YOUR_SECURE_PASSWORD","host":"storymine-production.xxxxx.us-east-1.rds.amazonaws.com","port":"5432","database":"storymine"}'

# Claude API key
aws secretsmanager create-secret \
  --name storymine/production/claude-api-key \
  --description "Claude API key for Jordi" \
  --secret-string "YOUR_CLAUDE_API_KEY"

# JWT secret
aws secretsmanager create-secret \
  --name storymine/production/jwt-secret \
  --description "JWT signing secret" \
  --secret-string "YOUR_JWT_SECRET_256_BITS"
```

## Step 4: ECS Cluster and Services

### 4.1 Create ECS Cluster

```json
{
  "clusterName": "storymine-production",
  "tags": [
    {
      "key": "Environment",
      "value": "production"
    },
    {
      "key": "Application",
      "value": "storymine"
    }
  ],
  "capacityProviders": ["FARGATE"],
  "defaultCapacityProviderStrategy": [
    {
      "capacityProvider": "FARGATE",
      "weight": 1
    }
  ]
}
```

### 4.2 Task Definitions

**Backend Task Definition** (`task-definitions/backend.json`):
```json
{
  "family": "storymine-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT_ID:role/storymine-backend-task-role",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/storymine/backend:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3001"
        },
        {
          "name": "REDIS_URL",
          "value": "redis://storymine-cache.xxxxx.cache.amazonaws.com:6379"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:storymine/production/database"
        },
        {
          "name": "CLAUDE_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:storymine/production/claude-api-key"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:storymine/production/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/storymine-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3001/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

**Frontend Task Definition** (`task-definitions/frontend.json`):
```json
{
  "family": "storymine-frontend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/storymine/frontend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "NEXT_PUBLIC_API_URL",
          "value": "https://api.yourdomain.com"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/storymine-frontend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### 4.3 Create ECS Services

```bash
# Create backend service
aws ecs create-service \
  --cluster storymine-production \
  --service-name storymine-backend \
  --task-definition storymine-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --platform-version LATEST \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx,subnet-yyyyy],securityGroups=[sg-xxxxx],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:ACCOUNT_ID:targetgroup/storymine-backend-tg/xxxxx,containerName=backend,containerPort=3001" \
  --enable-logging

# Create frontend service
aws ecs create-service \
  --cluster storymine-production \
  --service-name storymine-frontend \
  --task-definition storymine-frontend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --platform-version LATEST \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx,subnet-yyyyy],securityGroups=[sg-xxxxx],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:ACCOUNT_ID:targetgroup/storymine-frontend-tg/xxxxx,containerName=frontend,containerPort=3000"
```

## Step 5: Load Balancer Configuration

### 5.1 Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name storymine-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4

# Create target groups
aws elbv2 create-target-group \
  --name storymine-frontend-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxxxx \
  --target-type ip \
  --health-check-path / \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3

aws elbv2 create-target-group \
  --name storymine-backend-tg \
  --protocol HTTP \
  --port 3001 \
  --vpc-id vpc-xxxxx \
  --target-type ip \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3
```

### 5.2 SSL Certificate

```bash
# Request SSL certificate
aws acm request-certificate \
  --domain-name yourdomain.com \
  --subject-alternative-names "*.yourdomain.com" \
  --validation-method DNS \
  --region us-east-1
```

## Step 6: StoryMap Intelligence Data Import

### 6.1 S3 Data Storage

```bash
# Create S3 bucket for Intelligence data
aws s3 mb s3://storymine-intelligence-data-ACCOUNT_ID
aws s3api put-bucket-versioning \
  --bucket storymine-intelligence-data-ACCOUNT_ID \
  --versioning-configuration Status=Enabled

# Upload Intelligence data
aws s3 sync ./storymine-data/ s3://storymine-intelligence-data-ACCOUNT_ID/latest/ \
  --storage-class STANDARD_IA
```

### 6.2 Scheduled Import Task

**Import Task Definition** (`task-definitions/intelligence-import.json`):
```json
{
  "family": "storymine-intelligence-import",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "2048",
  "memory": "4096",
  "executionRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT_ID:role/storymine-import-task-role",
  "containerDefinitions": [
    {
      "name": "intelligence-import",
      "image": "ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/storymine/intelligence-import:latest",
      "command": ["node", "scripts/importIntelligenceData.js", "--data-dir", "/data", "--quality-report"],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "DATA_SOURCE",
          "value": "s3"
        },
        {
          "name": "S3_BUCKET",
          "value": "storymine-intelligence-data-ACCOUNT_ID"
        },
        {
          "name": "S3_PREFIX",
          "value": "latest/"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:storymine/production/database"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/storymine-intelligence-import",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "mountPoints": [
        {
          "sourceVolume": "efs-data",
          "containerPath": "/data"
        }
      ]
    }
  ],
  "volumes": [
    {
      "name": "efs-data",
      "efsVolumeConfiguration": {
        "fileSystemId": "fs-xxxxx",
        "rootDirectory": "/storymine-data"
      }
    }
  ]
}
```

### 6.3 EventBridge Scheduled Import

```bash
# Create EventBridge rule for weekly data imports
aws events put-rule \
  --name storymine-intelligence-import \
  --schedule-expression "rate(7 days)" \
  --description "Weekly StoryMap Intelligence data import"

# Add ECS task as target
aws events put-targets \
  --rule storymine-intelligence-import \
  --targets "Id"="1","Arn"="arn:aws:ecs:us-east-1:ACCOUNT_ID:cluster/storymine-production","RoleArn"="arn:aws:iam::ACCOUNT_ID:role/ecsEventsRole","EcsParameters"="{\"TaskDefinitionArn\":\"arn:aws:ecs:us-east-1:ACCOUNT_ID:task-definition/storymine-intelligence-import:1\",\"LaunchType\":\"FARGATE\",\"NetworkConfiguration\":{\"awsvpcConfiguration\":{\"Subnets\":[\"subnet-xxxxx\",\"subnet-yyyyy\"],\"SecurityGroups\":[\"sg-xxxxx\"],\"AssignPublicIp\":\"DISABLED\"}}}"
```

## Step 7: CloudFront CDN

### 7.1 CloudFront Distribution

```json
{
  "DistributionConfig": {
    "CallerReference": "storymine-production-2024",
    "Comment": "StoryMine Production CDN",
    "DefaultRootObject": "index.html",
    "Origins": [
      {
        "Id": "storymine-alb",
        "DomainName": "storymine-alb-xxxxx.us-east-1.elb.amazonaws.com",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "https-only"
        }
      }
    ],
    "DefaultCacheBehavior": {
      "TargetOriginId": "storymine-alb",
      "ViewerProtocolPolicy": "redirect-to-https",
      "TrustedSigners": {
        "Enabled": false
      },
      "ForwardedValues": {
        "QueryString": true,
        "Cookies": {
          "Forward": "all"
        },
        "Headers": [
          "Host",
          "Authorization",
          "CloudFront-Forwarded-Proto"
        ]
      },
      "MinTTL": 0,
      "DefaultTTL": 86400,
      "MaxTTL": 31536000
    },
    "CacheBehaviors": [
      {
        "PathPattern": "/api/*",
        "TargetOriginId": "storymine-alb",
        "ViewerProtocolPolicy": "https-only",
        "TrustedSigners": {
          "Enabled": false
        },
        "ForwardedValues": {
          "QueryString": true,
          "Cookies": {
            "Forward": "all"
          },
          "Headers": [
            "*"
          ]
        },
        "MinTTL": 0,
        "DefaultTTL": 0,
        "MaxTTL": 0
      }
    ],
    "Enabled": true,
    "Aliases": ["yourdomain.com", "www.yourdomain.com"],
    "ViewerCertificate": {
      "AcmCertificateArn": "arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/xxxxx",
      "SslSupportMethod": "sni-only",
      "MinimumProtocolVersion": "TLSv1.2_2021"
    }
  }
}
```

## Step 8: Monitoring and Logging

### 8.1 CloudWatch Dashboards

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ECS", "CPUUtilization", "ServiceName", "storymine-backend", "ClusterName", "storymine-production"],
          ["AWS/ECS", "MemoryUtilization", "ServiceName", "storymine-backend", "ClusterName", "storymine-production"]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "Backend Resource Utilization"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", "app/storymine-alb/xxxxx"],
          ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", "app/storymine-alb/xxxxx"]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "Application Performance"
      }
    }
  ]
}
```

### 8.2 CloudWatch Alarms

```bash
# High CPU utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "StoryMine-Backend-HighCPU" \
  --alarm-description "Backend CPU utilization is high" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ServiceName,Value=storymine-backend Name=ClusterName,Value=storymine-production \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:storymine-alerts

# Database connection alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "StoryMine-DB-HighConnections" \
  --alarm-description "Database connection count is high" \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=DBInstanceIdentifier,Value=storymine-production \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:storymine-alerts
```

## Step 9: Auto Scaling

### 9.1 ECS Auto Scaling

```bash
# Register scalable target for backend
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/storymine-production/storymine-backend \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/storymine-production/storymine-backend \
  --policy-name storymine-backend-cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleOutCooldown": 300,
    "ScaleInCooldown": 300
  }'
```

## Step 10: Deployment Pipeline

### 10.1 GitHub Actions Workflow

```yaml
name: Deploy to AWS
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build and push backend image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: storymine/backend
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG ./src/backend
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG

      - name: Build and push frontend image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: storymine/frontend
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG ./src/frontend
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG

      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster storymine-production \
            --service storymine-backend \
            --force-new-deployment
          
          aws ecs update-service \
            --cluster storymine-production \
            --service storymine-frontend \
            --force-new-deployment
```

## Estimated Costs

### Monthly AWS Costs (Production)

- **ECS Fargate**: ~$150-300/month (2-4 tasks running)
- **RDS PostgreSQL** (r5.xlarge): ~$350/month
- **ElastiCache Redis** (r6g.large): ~$180/month
- **ALB**: ~$25/month
- **CloudFront**: ~$10-50/month (depending on traffic)
- **S3 Storage**: ~$25/month (for Intelligence data)
- **Data Transfer**: ~$10-50/month
- **CloudWatch**: ~$10-30/month

**Total Estimated**: $760-1,000/month

### Cost Optimization Tips

1. **Use Reserved Instances** for RDS (30-60% savings)
2. **Spot Instances** for development environments
3. **S3 Intelligent Tiering** for data storage
4. **CloudWatch Logs retention** policies
5. **Auto Scaling** to minimize idle resources

## Security Best Practices

1. **VPC Configuration**:
   - Private subnets for ECS tasks and RDS
   - NAT Gateways for outbound internet access
   - Security Groups with minimal required access

2. **IAM Roles**:
   - Least privilege principle
   - Separate roles for each service
   - Cross-account access if needed

3. **Secrets Management**:
   - AWS Secrets Manager for all credentials
   - Encryption at rest and in transit
   - Regular secret rotation

4. **Network Security**:
   - WAF rules for common attacks
   - VPC Flow Logs enabled
   - Security Group rules auditing

## Backup and Disaster Recovery

1. **Database Backups**:
   - Automated daily backups (7-day retention)
   - Cross-region backup replication
   - Point-in-time recovery enabled

2. **Application Data**:
   - S3 Cross-Region Replication
   - Versioning enabled
   - Lifecycle policies for cost optimization

3. **Infrastructure as Code**:
   - All infrastructure defined in CloudFormation/Terraform
   - Version controlled
   - Multi-region deployment capability

## Deployment Checklist

- [ ] VPC and networking configured
- [ ] RDS PostgreSQL instance created and configured
- [ ] ElastiCache Redis cluster created
- [ ] ECR repositories created
- [ ] Docker images built and pushed
- [ ] Secrets stored in AWS Secrets Manager
- [ ] ECS cluster and services created
- [ ] Load balancer and target groups configured
- [ ] SSL certificate requested and validated
- [ ] Route 53 DNS configured
- [ ] CloudFront distribution created
- [ ] Auto Scaling policies configured
- [ ] Monitoring and alerting setup
- [ ] Intelligence data uploaded to S3
- [ ] Scheduled import tasks configured
- [ ] Backup and disaster recovery verified

## Next Steps

1. **Deploy Infrastructure**: Follow steps 1-9 to deploy to AWS
2. **Import Intelligence Data**: Use the scheduled import task to load StoryMap Intelligence data
3. **Configure Monitoring**: Set up CloudWatch dashboards and alarms
4. **Performance Testing**: Load test the application with realistic traffic
5. **Security Review**: Conduct security audit and penetration testing
6. **User Acceptance Testing**: Test all Jordi functionality with real users
7. **Go Live**: Update DNS to point to production environment

## Support and Troubleshooting

### Common Issues

1. **ECS Task Startup Failures**:
   - Check CloudWatch logs
   - Verify security group rules
   - Confirm secrets are accessible

2. **Database Connection Issues**:
   - Verify security group allows ECS to RDS
   - Check database credentials in Secrets Manager
   - Confirm VPC configuration

3. **Load Balancer Health Check Failures**:
   - Verify health check path is correct
   - Check security groups allow ALB to ECS
   - Review application startup time

### Getting Help

- **AWS Support**: Use AWS Support for infrastructure issues
- **CloudWatch Logs**: All application logs are centralized
- **ECS Exec**: Enable ECS Exec for debugging running tasks
- **Application Monitoring**: Use AWS X-Ray for request tracing

---

**Ready to deploy StoryMine to AWS? Start with Step 1 and follow this guide sequentially.** 