# Letter to StoryMap Intelligence Team
## Data Quality Issues and Requirements for StoryMine Platform

**Date:** June 14, 2025  
**From:** StoryMine Development Team  
**To:** StoryMap Intelligence Team  
**Subject:** Critical Data Quality Issues in AWS Deployment - Request for Resolution

---

## Executive Summary

StoryMine is designed as a **presentation and mining platform** that receives quality information from your intelligence system. Our sole job is to present pre-analyzed, high-quality documentary stories to users. However, we have discovered significant data quality issues in the AWS deployment that prevent us from fulfilling this core function.

## Current Problem

After implementing StoryMine v4.0.0 to use your AWS-deployed intelligence data, we discovered that the `intelligence_articles` table contains heavily corrupted OCR data instead of clean, analyzed articles.

### Sample Data Issues Found

**Corrupted Titles:**
- "NEW LABOR FIGHT"
- "a brilliant 3 on the last hole. Only Lumber. Unaffected."
- "Dal had "admitted guilt under By PHIL NEWSOM"
- "Reports of Weather Bureau Stations."
- "Fied "Willie" Stevens as a man he"

**Corrupted Content:**
- OCR artifacts: "ofthe", "inthe", "tothe", "asaman", "byavoice"
- Incomplete sentences and fragments
- Concatenated words from newspaper digitization errors
- Weather reports and page headers mixed with article content

## What StoryMine Needs

StoryMine should **only** receive and present quality information. We need:

### 1. Clean Article Titles
- **Proper newspaper headlines** (not OCR fragments)
- **Complete, meaningful titles** that describe the story
- **No bylines, weather reports, or page headers** as titles

### 2. Clean Article Content
- **Properly formatted article text** with correct spacing
- **OCR errors corrected** (no "ofthe", "inthe" concatenations)
- **Complete articles** (not fragments or partial text)

### 3. Reliable Metadata
- **Accurate publication dates**
- **Verified themes and categories**
- **Correct geographic locations**
- **Validated documentary potential and narrative scores**

## Questions for StoryMap Intelligence Team

### Data Source Questions
1. **What is the source of the current data?** Is this raw OCR output from newspaper digitization?
2. **Has any cleaning or processing been applied** to the article titles and content?
3. **Are there cleaner versions** of these articles available in your system?

### Processing Questions
4. **What analysis was performed** to generate the documentary_potential and narrative_score values?
5. **Were these scores applied to the raw OCR data** or to cleaned article content?
6. **Can you provide sample "good quality" articles** that meet your standards?

### Resolution Questions
7. **Can you reprocess the data** to provide clean titles and content?
8. **Do you have access to better source material** (original newspaper archives, cleaned OCR, etc.)?
9. **What is your timeline** for providing quality-assured data to StoryMine?

## Specific Test Request

Please provide us with **50 sample articles** that represent the quality standard you intend for StoryMine, including:

- **Clean, meaningful titles** (proper newspaper headlines)
- **Readable article content** (OCR errors corrected)
- **Accurate metadata** (themes, locations, dates)
- **Validated scores** (documentary_potential, narrative_score)

## StoryMine's Role Clarification

To be absolutely clear about StoryMine's function:

### What StoryMine SHOULD Do:
- ✅ **Present** pre-analyzed stories to users
- ✅ **Filter and sort** by your provided categories and scores
- ✅ **Display** documentary potential and narrative scores
- ✅ **Enable discovery** through your intelligence metadata

### What StoryMine Should NOT Do:
- ❌ **Analyze or score** article content
- ❌ **Clean or correct** OCR data
- ❌ **Generate** documentary potential scores
- ❌ **Create** themes or categories from raw content

## Impact on StoryMine Users

The current data quality issues result in:
- **Poor user experience** with nonsensical titles and fragments
- **Lack of trust** in the documentary scoring system
- **Inability to find** meaningful historical stories
- **Failure to deliver** on StoryMine's core value proposition

## Requested Action Items

1. **Immediate Assessment:** Review the current AWS database for data quality issues
2. **Source Investigation:** Identify the root cause of OCR corruption in the dataset
3. **Quality Standards:** Define minimum quality thresholds for article titles and content
4. **Data Reprocessing:** Clean and reprocess the 282,388 articles with proper OCR correction
5. **Validation Testing:** Provide sample datasets for StoryMine testing before full deployment
6. **Timeline Communication:** Provide estimated timeline for quality-assured data delivery

## Technical Specifications

For StoryMine to function properly, we need:

### Database Schema Requirements
```sql
intelligence_articles (
  storymap_id UUID PRIMARY KEY,
  title VARCHAR(500) NOT NULL,           -- Clean newspaper headline
  content TEXT NOT NULL,                 -- OCR-corrected article text
  publication_date DATE NOT NULL,
  documentary_potential FLOAT NOT NULL,  -- 0.0-1.0, validated
  narrative_score FLOAT NOT NULL,        -- 0.0-1.0, validated
  primary_themes TEXT[] NOT NULL,        -- Verified themes
  primary_location VARCHAR(200),         -- Validated location
  -- All fields should be non-null and quality-assured
);
```

### Quality Assurance Standards
- **Title Length:** 15-200 characters, complete headlines
- **Content Length:** Minimum 500 characters, complete articles
- **OCR Quality:** No concatenated words, proper spacing
- **Score Validation:** All scores between 0.0-1.0, mathematically sound
- **Theme Accuracy:** Themes should match article content
- **Location Verification:** Geographic data should be accurate

## Conclusion

StoryMine's success depends entirely on receiving quality-assured data from your intelligence system. We are not equipped to handle data cleaning, OCR correction, or content analysis - that is your domain of expertise.

We request your immediate attention to resolve these data quality issues so that StoryMine can fulfill its intended role as a presentation and discovery platform for historical documentary content.

Please provide:
1. **Assessment timeline** for reviewing current data quality
2. **Sample dataset** of 50 quality-assured articles for testing
3. **Reprocessing timeline** for the full 282,388 article dataset
4. **Quality standards documentation** for ongoing data delivery

We appreciate your partnership and look forward to your response.

---

**Contact Information:**  
StoryMine Development Team  
For technical questions and coordination

**Priority:** High - Blocking StoryMine v4.0.0 production deployment  
**Impact:** Critical - Core platform functionality compromised 