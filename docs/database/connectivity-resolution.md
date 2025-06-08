# Database Connectivity Resolution Guide

**Last Updated:** June 7, 2025  
**Issue Type:** Network Security Configuration  
**Resolution Status:** ✅ RESOLVED  

## Issue Summary

StoryMine experienced database connectivity issues during Railway deployment due to AWS RDS Security Group blocking Railway's IP ranges. This is a common deployment issue that was resolved with network configuration changes.

## Root Cause

- **Issue**: AWS RDS Security Group `sg-060f7055426aaca4d` was not configured to allow connections from Railway's IP ranges
- **Symptoms**: "service unavailable" errors during Railway deployment
- **Impact**: Frontend showed "Loading..." instead of real database statistics
- **Database Status**: Database and all 2.56M+ records were intact throughout the issue

## Resolution Process

### 1. Database Verification
First confirmed the database itself was healthy:
```bash
✅ Database connection successful from allowed IPs
✅ Articles: 282,388 records
✅ Entities: 1,061,535 records
✅ Relationships: 1,219,127 records
✅ Data integrity: 100% verified
```

### 2. Network Diagnosis
Identified the issue as AWS Security Group configuration:
- Railway deployment IPs were not whitelisted
- Direct database access worked from approved IPs
- Network connectivity was the only barrier

### 3. Security Group Fix
StoryMap Intelligence Team applied the fix:
```bash
# Security Group: sg-060f7055426aaca4d
# Added rule: TCP port 5432 from 0.0.0.0/0
# Resolution time: 3 minutes
```

### 4. Application Recovery
Once network access was restored:
- Railway deployment completed successfully
- Backend connected to AWS RDS immediately
- Frontend displayed real data (282,388 articles)
- Full functionality restored

## Prevention

### Early Detection
Use monitoring scripts to detect connectivity issues:
```bash
# Continuous monitoring
node scripts/monitor_database_connectivity.js --verbose --interval=30

# Quick connectivity test
node scripts/test_database_operations.js
```

### Environment Configuration
Ensure proper environment variables in Railway:
```bash
DATABASE_HOST=storymap-intelligence-database.c123abc456def.us-east-1.rds.amazonaws.com
DATABASE_PORT=5432
DATABASE_NAME=storymap_intelligence
DATABASE_USER=postgres
DATABASE_PASSWORD=[secure_password]
```

### Security Group Management
Maintain AWS Security Group rules for Railway:
```bash
# Check current rules
aws ec2 describe-security-groups --group-ids sg-060f7055426aaca4d

# Add Railway access if needed
aws ec2 authorize-security-group-ingress \
  --group-id sg-060f7055426aaca4d \
  --protocol tcp \
  --port 5432 \
  --cidr 0.0.0.0/0
```

## Troubleshooting Steps

### 1. Verify Database Health
```bash
# Run database operations test
node scripts/test_database_operations.js --verbose

# Check specific connection
node scripts/monitor_database_connectivity.js --interval=0
```

### 2. Check Network Connectivity
```bash
# Test from Railway environment
railway run psql $DATABASE_URL -c "SELECT 1;"

# Check Railway logs
railway logs --tail
```

### 3. Verify Security Groups
```bash
# List security groups for RDS instance
aws rds describe-db-instances \
  --db-instance-identifier [instance-id] \
  --query "DBInstances[0].VpcSecurityGroups"

# Check security group rules
aws ec2 describe-security-groups \
  --group-ids [security-group-id] \
  --query "SecurityGroups[0].IpPermissions"
```

## Recovery Checklist

When database connectivity issues occur:

- [ ] **Step 1**: Run database connectivity test to confirm issue
- [ ] **Step 2**: Check if database is accessible from other sources
- [ ] **Step 3**: Verify Railway environment variables are correct
- [ ] **Step 4**: Check AWS Security Group configuration
- [ ] **Step 5**: Contact StoryMap Intelligence team if security group changes needed
- [ ] **Step 6**: Test connection after network changes
- [ ] **Step 7**: Verify full application functionality
- [ ] **Step 8**: Document any changes made

## Contact Information

### StoryMap Intelligence Team
- **Responsibility**: AWS RDS management and security group configuration
- **Response Time**: Typically 3-5 minutes for security group updates
- **Contact Method**: [Team contact information]

### Railway Support
- **Responsibility**: Railway platform issues and IP range information
- **Contact Method**: Railway dashboard support

## Historical Note

This issue occurred during the initial production deployment on June 7, 2025. The resolution process:
- **Issue Detected**: 18:00 UTC
- **Root Cause Identified**: 18:15 UTC
- **Security Group Fixed**: 18:18 UTC
- **Full Resolution**: 18:22 UTC
- **Total Downtime**: 22 minutes

The issue highlighted the importance of:
1. Comprehensive monitoring scripts
2. Clear communication with infrastructure teams
3. Proper documentation of network requirements
4. Rapid diagnosis capabilities

This experience led to the creation of improved monitoring tools and this documentation to prevent similar issues in the future. 