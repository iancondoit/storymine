#!/usr/bin/env node

/**
 * StoryMap Intelligence Data Import Script
 * 
 * This script imports the processed data from StoryMap Intelligence
 * into the StoryMine database for use by Jordi.
 * 
 * Usage:
 * npm run import:intelligence -- --data-dir ./storymine-data
 * npm run import:intelligence -- --help
 */

import { StoryMapIntelligenceImport } from '../src/services/storyMapIntelligenceImport';
import { program } from 'commander';
import path from 'path';

// CLI Configuration
program
  .name('import-intelligence-data')
  .description('Import StoryMap Intelligence processed data for Jordi')
  .version('1.0.0')
  .option('-d, --data-dir <path>', 'Data directory containing StoryMap Intelligence output', './storymine-data')
  .option('-b, --batch-size <number>', 'Batch size for processing', '1000')
  .option('--no-validate', 'Skip data validation')
  .option('--no-backup', 'Skip creating backup')
  .option('--allow-duplicates', 'Allow duplicate records')
  .option('--dry-run', 'Perform a dry run without importing data')
  .option('--quality-report', 'Generate data quality report after import')
  .option('--verbose', 'Enable verbose logging')
  .parse();

const options = program.opts();

async function main() {
  console.log('🚀 StoryMap Intelligence Data Import Tool');
  console.log('=========================================\n');

  if (options.verbose) {
    console.log('Configuration:');
    console.log(`  Data Directory: ${options.dataDir}`);
    console.log(`  Batch Size: ${options.batchSize}`);
    console.log(`  Validate Data: ${options.validate !== false}`);
    console.log(`  Create Backup: ${options.backup !== false}`);
    console.log(`  Skip Duplicates: ${!options.allowDuplicates}`);
    console.log(`  Dry Run: ${options.dryRun || false}`);
    console.log(`  Quality Report: ${options.qualityReport || false}\n`);
  }

  // Validate data directory
  const dataDirectory = path.resolve(options.dataDir);
  
  try {
    const fs = await import('fs');
    if (!fs.existsSync(dataDirectory)) {
      console.error(`❌ Error: Data directory does not exist: ${dataDirectory}`);
      console.error('\nPlease ensure you have:');
      console.error('1. Downloaded the StoryMap Intelligence data');
      console.error('2. Extracted it to the correct location');
      console.error('3. Specified the correct path with --data-dir');
      process.exit(1);
    }

    // Check for expected files
    const expectedFiles = [
      path.join(dataDirectory, 'phase1', 'enhanced_articles_complete.json'),
      path.join(dataDirectory, 'phase2b'), // Directory with batch files
      path.join(dataDirectory, 'phase3_stories', 'story_relationships.json.gz'),
      path.join(dataDirectory, 'phase3_stories', 'temporal_narrative.json')
    ];

    const missingFiles = [];
    for (const filePath of expectedFiles) {
      if (!fs.existsSync(filePath)) {
        missingFiles.push(filePath);
      }
    }

    if (missingFiles.length > 0) {
      console.warn('⚠️  Warning: Some expected files are missing:');
      missingFiles.forEach(file => console.warn(`   - ${file}`));
      console.warn('\nThe import will continue but may not import all data types.\n');
    }

  } catch (error) {
    console.error('❌ Error validating data directory:', error);
    process.exit(1);
  }

  if (options.dryRun) {
    console.log('🧪 DRY RUN MODE - No data will be imported');
    console.log('This would import data from:', dataDirectory);
    return;
  }

  // Create import service
  const importService = new StoryMapIntelligenceImport({
    dataDirectory,
    batchSize: parseInt(options.batchSize),
    validateData: options.validate !== false,
    skipDuplicates: !options.allowDuplicates,
    createBackup: options.backup !== false
  });

  // Set up progress monitoring
  if (options.verbose) {
    const progressInterval = setInterval(() => {
      const progress = importService.getProgress();
      if (progress.processedRecords > 0) {
        console.log(`📊 Progress: ${progress.processedRecords} records processed, ${progress.errors.length} errors`);
      }
    }, 5000);

    // Clear interval on completion
    process.on('exit', () => clearInterval(progressInterval));
  }

  // Perform the import
  try {
    console.log('🎬 Starting import process...\n');
    const result = await importService.importAllData();

    if (result.success) {
      console.log('\n✅ Import completed successfully!');
      console.log(`📊 Summary:`);
      console.log(`   - Total Processed: ${result.total_processed}`);
      console.log(`   - Successful: ${result.successful_imports}`);
      console.log(`   - Failed: ${result.failed_imports}`);
      console.log(`   - Processing Time: ${result.processing_time_ms}ms`);
      console.log(`   - Articles: ${result.summary.articles}`);
      console.log(`   - Entities: ${result.summary.entities}`);
      console.log(`   - Relationships: ${result.summary.relationships}`);
      console.log(`   - Story Threads: ${result.summary.story_threads}`);
      console.log(`   - Timeline Entries: ${result.summary.timeline_entries}`);

      if (result.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        result.warnings.forEach(warning => console.log(`   - ${warning}`));
      }

      if (result.errors.length > 0) {
        console.log('\n❌ Errors:');
        result.errors.forEach(error => console.log(`   - ${error}`));
      }

      // Generate quality report if requested
      if (options.qualityReport) {
        console.log('\n📈 Generating data quality report...');
        try {
          const qualityReport = await importService.generateQualityReport();
          console.log('\n📊 Data Quality Report:');
          console.log(`   - Total Records: ${qualityReport.total_records}`);
          console.log(`   - High Quality: ${qualityReport.quality_distribution.high_quality}`);
          console.log(`   - Medium Quality: ${qualityReport.quality_distribution.medium_quality}`);
          console.log(`   - Low Quality: ${qualityReport.quality_distribution.low_quality}`);
          console.log('\n💡 Recommendations:');
          qualityReport.recommendations.forEach(rec => console.log(`   - ${rec}`));
        } catch (error) {
          console.error('❌ Failed to generate quality report:', error);
        }
      }

      console.log('\n🎉 Jordi is now ready to use the StoryMap Intelligence data!');
      console.log('\nNext steps:');
      console.log('1. Test Jordi with queries like "show me five stories that would be great for documentary series"');
      console.log('2. Monitor query performance and adjust indexes if needed');
      console.log('3. Review the data quality report to identify any areas for improvement');

    } else {
      console.error('\n❌ Import failed!');
      console.error(`Errors encountered: ${result.errors.length}`);
      result.errors.forEach(error => console.error(`   - ${error}`));
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💥 Unexpected error during import:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
} 