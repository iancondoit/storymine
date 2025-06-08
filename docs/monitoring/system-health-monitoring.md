# StoryMine System Health Monitoring

**Version:** 1.0.0  
**Last Updated:** June 7, 2025  
**Purpose:** Comprehensive monitoring and diagnostics for production StoryMine deployment

## Overview

StoryMine includes a comprehensive monitoring system to ensure reliable AWS database connectivity and overall system health. This system provides early warning of issues, detailed diagnostics, and automated reporting.

## Monitoring Tools

### 1. Database Connectivity Monitor
**Script:** `scripts/monitor_database_connectivity.js`  
**Purpose:** Continuous monitoring of AWS RDS PostgreSQL connection health

```bash
# Quick connectivity check
npm run monitor

# Continuous monitoring (30-second intervals)
npm run monitor:continuous

# Manual invocation with custom interval
node scripts/monitor_database_connectivity.js --interval=60 --verbose
```

**Features:**
- Basic connection testing
- Data integrity validation (record counts)
- Performance monitoring (connection and query times)
- Automatic alerting after consecutive failures
- Detailed logging and reporting

### 2. Database Operations Test Suite
**Script:** `scripts/test_database_operations.js`  
**Purpose:** Comprehensive testing of all StoryMine database operations

```bash
# Full test suite with detailed output
npm run test:database

# Quick test for CI/CD pipelines
npm run test:quick

# Manual invocation
node scripts/test_database_operations.js --verbose
```

**Test Coverage:**
- Database statistics (homepage data)
- Jordi data access patterns
- Story discovery operations
- Performance stress tests
- Data consistency validation

### 3. Master Diagnostics Runner
**Script:** `scripts/run_all_diagnostics.js`  
**Purpose:** Unified health check combining all monitoring tools

```bash
# Complete system health check
npm run diagnostics

# Verbose system diagnostics
npm run diagnostics:verbose

# Continuous monitoring mode
npm run diagnostics:continuous

# Quick health verification
npm run health
```

**Capabilities:**
- Runs all database tests
- Checks application health
- Generates comprehensive reports
- Provides overall health scoring
- Offers actionable recommendations

## Monitoring Workflows

### Daily Health Check
```bash
# Run comprehensive diagnostics
npm run health

# Review system health report
cat logs/system_health_report.json

# Check for any alerts
grep -i "alert\|error" logs/master_diagnostics.log
```

### Deployment Verification
```bash
# Before deployment
npm run test:database

# After deployment
npm run diagnostics:verbose

# Verify live application
curl https://storymine-production.up.railway.app/api/health
```

### Troubleshooting Workflow
```bash
# Step 1: Quick connectivity test
npm run monitor

# Step 2: Comprehensive diagnostics
npm run diagnostics:verbose

# Step 3: Review detailed logs
tail -f logs/database_monitoring.log

# Step 4: Check Railway deployment
npm run logs
```

### Continuous Monitoring Setup
```bash
# Start continuous monitoring (run in screen/tmux)
npm run diagnostics:continuous

# Or use individual monitors
npm run monitor:continuous &

# Monitor specific aspects
node scripts/test_database_operations.js --continuous &
```

## Log Files and Reports

### Log Locations
- **Database Monitoring**: `logs/database_monitoring.log`
- **Operations Testing**: `logs/database_operations_test.log`
- **Master Diagnostics**: `logs/master_diagnostics.log`
- **Health Reports**: `logs/system_health_report.json`
- **Database Health**: `logs/database_health_report.json`

### Log Rotation
```bash
# Clean old logs (older than 7 days)
find logs/ -name "*.log" -mtime +7 -delete

# Archive monthly reports
mkdir -p logs/archive/$(date +%Y-%m)
mv logs/*.json logs/archive/$(date +%Y-%m)/
```

### Report Analysis
```bash
# View latest health report
jq . logs/system_health_report.json

# Check success rates
jq '.summary.successRate' logs/system_health_report.json

# Review recommendations
jq '.recommendations[]' logs/system_health_report.json
```

## Alert Thresholds

### Critical Alerts
- **Database Connection Failures**: 3 consecutive failures
- **Response Time**: > 30 seconds for complex queries
- **Data Integrity**: Missing > 10% of expected records
- **System Health**: Overall health rating "critical"

### Warning Alerts
- **Slow Connections**: > 5 seconds connection time
- **Performance Degradation**: > 25 seconds for standard queries
- **Missing Dependencies**: Railway CLI unavailable
- **Disk Space**: Logs directory write failures

### Notification Methods
```bash
# Email alerts (configure as needed)
if [ "$health_status" = "critical" ]; then
  echo "CRITICAL: StoryMine health issues detected" | mail -s "StoryMine Alert" admin@domain.com
fi

# Slack notifications (webhook integration)
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"StoryMine health check failed"}' \
  YOUR_SLACK_WEBHOOK_URL
```

## Performance Baselines

### Expected Response Times
- **Basic Connection**: < 2 seconds
- **Database Stats Query**: < 5 seconds
- **Entity Search**: < 10 seconds
- **Complex Story Discovery**: < 30 seconds
- **Full Test Suite**: < 2 minutes

### Success Rate Targets
- **Database Connectivity**: > 99.5%
- **Query Success Rate**: > 99.9%
- **Overall System Health**: > 95%

### Resource Usage
- **Memory Usage**: < 512MB for monitoring processes
- **CPU Usage**: < 10% during normal monitoring
- **Disk Usage**: < 100MB for logs per month
- **Network Usage**: < 1MB per monitoring cycle

## Automated Monitoring Setup

### Cron Jobs
```bash
# Add to crontab for automated monitoring
# Run health check every hour
0 * * * * cd /path/to/storymine && npm run health >> logs/cron.log 2>&1

# Generate daily reports
0 6 * * * cd /path/to/storymine && npm run diagnostics >> logs/daily-report.log 2>&1

# Weekly comprehensive test
0 2 * * 0 cd /path/to/storymine && npm run test:database >> logs/weekly-test.log 2>&1
```

### Systemd Service (Linux)
```ini
# /etc/systemd/system/storymine-monitor.service
[Unit]
Description=StoryMine Continuous Health Monitor
After=network.target

[Service]
Type=simple
User=storymine
WorkingDirectory=/path/to/storymine
ExecStart=/usr/bin/npm run diagnostics:continuous
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
```

### Docker Monitoring
```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  storymine-monitor:
    build: .
    command: npm run diagnostics:continuous
    environment:
      - NODE_ENV=production
      - DATABASE_HOST=${DATABASE_HOST}
      - DATABASE_PASSWORD=${DATABASE_PASSWORD}
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
```

## Integration with Railway

### Environment Variables
```bash
# Set in Railway dashboard
MONITORING_ENABLED=true
ALERT_WEBHOOK_URL=your-webhook-url
LOG_LEVEL=info
HEALTH_CHECK_INTERVAL=300
```

### Railway Monitoring Commands
```bash
# Check Railway deployment health
railway status

# Monitor Railway logs
railway logs --tail

# Deploy with health verification
railway up && sleep 30 && npm run health
```

## Troubleshooting Common Issues

### Database Connection Failures
1. Check environment variables: `echo $DATABASE_HOST`
2. Test manual connection: `psql $DATABASE_URL -c "SELECT 1;"`
3. Verify AWS Security Group settings
4. Check Railway network connectivity

### High Response Times
1. Run performance diagnostics: `npm run test:database`
2. Check PostgreSQL slow query log
3. Analyze query execution plans
4. Monitor AWS RDS performance metrics

### False Positive Alerts
1. Review alert thresholds in monitoring scripts
2. Check for network intermittency
3. Verify Railway platform status
4. Adjust sensitivity settings if needed

### Log File Issues
1. Check disk space: `df -h`
2. Verify write permissions: `ls -la logs/`
3. Rotate old logs: `find logs/ -name "*.log" -mtime +7 -delete`
4. Create logs directory: `mkdir -p logs`

## Best Practices

### Development
- Run health checks before committing code
- Include monitoring tests in CI/CD pipeline
- Test monitoring scripts with production data
- Document any new monitoring requirements

### Production
- Monitor continuously during peak hours
- Set up automated alerting
- Review performance trends weekly
- Maintain monitoring script updates

### Emergency Response
- Have escalation procedures documented
- Keep contact information current
- Test backup and recovery procedures
- Maintain runbook for common issues

---

**Quick Reference:**
- Health check: `npm run health`
- Continuous monitoring: `npm run diagnostics:continuous`
- View reports: `cat logs/system_health_report.json`
- Emergency diagnostics: `npm run diagnostics:verbose` 