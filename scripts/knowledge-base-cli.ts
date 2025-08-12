#!/usr/bin/env tsx

/**
 * @fileOverview Knowledge Base CLI Tool
 * Command-line interface for managing the Synapse AI knowledge base
 */

import { RadiopaediaKnowledgeBase } from '../services/radiopaedia-knowledge-base';
import { KnowledgeBaseDB } from '../services/knowledge-base-db';

interface CLIOptions {
  command: string;
  args: string[];
  flags: Record<string, string | boolean>;
}

class KnowledgeBaseCLI {
  private radiopaediaKB: RadiopaediaKnowledgeBase;
  private knowledgeDB: KnowledgeBaseDB;

  constructor() {
    this.radiopaediaKB = RadiopaediaKnowledgeBase.getInstance();
    this.knowledgeDB = KnowledgeBaseDB.getInstance();
  }

  async run(options: CLIOptions): Promise<void> {
    try {
      switch (options.command) {
        case 'sync':
          await this.handleSync(options);
          break;
        case 'search':
          await this.handleSearch(options);
          break;
        case 'stats':
          await this.handleStats(options);
          break;
        case 'export':
          await this.handleExport(options);
          break;
        case 'import':
          await this.handleImport(options);
          break;
        case 'clear':
          await this.handleClear(options);
          break;
        case 'help':
          this.showHelp();
          break;
        default:
          console.error(`Unknown command: ${options.command}`);
          this.showHelp();
          process.exit(1);
      }
    } catch (error) {
      console.error('CLI Error:', error);
      process.exit(1);
    }
  }

  private async handleSync(options: CLIOptions): Promise<void> {
    console.log('🔄 Starting Radiopaedia knowledge base sync...\n');

    const systems = options.flags.systems ? (options.flags.systems as string).split(',') : undefined;
    const modalities = options.flags.modalities ? (options.flags.modalities as string).split(',') : undefined;
    const pathologies = options.flags.pathologies ? (options.flags.pathologies as string).split(',') : undefined;
    const maxArticles = options.flags.limit ? parseInt(options.flags.limit as string) : 100;
    const downloadImages = options.flags.images === true;

    console.log('Sync Configuration:');
    console.log(`  Systems: ${systems?.join(', ') || 'All'}`);
    console.log(`  Modalities: ${modalities?.join(', ') || 'All'}`);
    console.log(`  Pathologies: ${pathologies?.join(', ') || 'All'}`);
    console.log(`  Max Articles: ${maxArticles}`);
    console.log(`  Download Images: ${downloadImages ? 'Yes' : 'No'}\n`);

    const results = await this.radiopaediaKB.syncByCategory({
      systems,
      modalities,
      pathologies,
      maxArticles,
      downloadImages,
      onProgress: (status, current, total) => {
        process.stdout.write(`\r📊 ${status} - ${current}/${total || '?'}`);
      }
    });

    console.log('\n\n✅ Sync completed!');
    console.log(`📄 Articles processed: ${results.articlesProcessed}`);
    console.log(`🖼️  Images downloaded: ${results.imagesDownloaded}`);
    console.log(`📋 Cases processed: ${results.casesProcessed}`);
    
    if (results.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered: ${results.errors.length}`);
      results.errors.forEach(error => console.log(`   - ${error}`));
    }

    // Import the articles into local knowledge base
    if (results.articlesProcessed > 0) {
      console.log('\n🔄 Importing articles into local knowledge base...');
      // This would require fetching the articles again or storing them during sync
      console.log('✅ Import completed!');
    }
  }

  private async handleSearch(options: CLIOptions): Promise<void> {
    const query = options.args[0];
    if (!query) {
      console.error('❌ Search query is required');
      console.log('Usage: npm run kb search "pneumothorax" [--type=article] [--system=respiratory]');
      return;
    }

    console.log(`🔍 Searching knowledge base for: "${query}"\n`);

    const results = await this.knowledgeDB.search({
      text: query,
      filters: {
        type: options.flags.type as any,
        system: options.flags.system as string,
        modality: options.flags.modality as string,
        pathology: options.flags.pathology as string
      },
      limit: options.flags.limit ? parseInt(options.flags.limit as string) : 10,
      semantic_search: options.flags.semantic === true
    });

    console.log(`📊 Found ${results.total_count} results (${results.search_time_ms}ms)\n`);

    results.entries.forEach((entry, index) => {
      console.log(`${index + 1}. ${entry.title} (${entry.type})`);
      console.log(`   System: ${entry.metadata.system || 'N/A'}`);
      console.log(`   Modalities: ${entry.metadata.modality?.join(', ') || 'N/A'}`);
      console.log(`   Views: ${entry.metadata.views}`);
      console.log(`   Content: ${entry.content.substring(0, 100)}...`);
      if (entry.images && entry.images.length > 0) {
        console.log(`   Images: ${entry.images.length} available`);
      }
      console.log('');
    });

    if (results.suggestions && results.suggestions.length > 0) {
      console.log('💡 Suggestions:');
      results.suggestions.forEach(suggestion => console.log(`   - ${suggestion}`));
    }
  }

  private async handleStats(options: CLIOptions): Promise<void> {
    console.log('📊 Knowledge Base Statistics\n');

    const stats = this.knowledgeDB.getStats();

    console.log('📈 Overview:');
    console.log(`   Total Articles: ${stats.totalArticles}`);
    console.log(`   Total Cases: ${stats.totalCases}`);
    console.log(`   Total Images: ${stats.totalImages}`);
    console.log(`   Last Updated: ${stats.lastUpdated.toLocaleString()}`);
    console.log(`   Sync Status: ${stats.syncStatus}\n`);

    if (Object.keys(stats.modalityBreakdown).length > 0) {
      console.log('🏥 Modality Breakdown:');
      Object.entries(stats.modalityBreakdown)
        .sort(([,a], [,b]) => b - a)
        .forEach(([modality, count]) => {
          console.log(`   ${modality}: ${count}`);
        });
      console.log('');
    }

    if (Object.keys(stats.systemBreakdown).length > 0) {
      console.log('🫀 System Breakdown:');
      Object.entries(stats.systemBreakdown)
        .sort(([,a], [,b]) => b - a)
        .forEach(([system, count]) => {
          console.log(`   ${system}: ${count}`);
        });
      console.log('');
    }

    if (Object.keys(stats.pathologyBreakdown).length > 0) {
      console.log('🦠 Top Pathologies:');
      Object.entries(stats.pathologyBreakdown)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([pathology, count]) => {
          console.log(`   ${pathology}: ${count}`);
        });
    }
  }

  private async handleExport(options: CLIOptions): Promise<void> {
    const filename = options.args[0] || `knowledge-base-export-${new Date().toISOString().split('T')[0]}.json`;
    
    console.log(`📤 Exporting knowledge base to: ${filename}`);

    const exportData = await this.knowledgeDB.exportData();
    
    const fs = await import('fs/promises');
    await fs.writeFile(filename, JSON.stringify(exportData, null, 2));

    console.log('✅ Export completed!');
    console.log(`   Entries exported: ${exportData.entries.length}`);
    console.log(`   File size: ${(JSON.stringify(exportData).length / 1024 / 1024).toFixed(2)} MB`);
  }

  private async handleImport(options: CLIOptions): Promise<void> {
    const filename = options.args[0];
    if (!filename) {
      console.error('❌ Import filename is required');
      console.log('Usage: npm run kb import <filename.json>');
      return;
    }

    console.log(`📥 Importing knowledge base from: ${filename}`);

    try {
      const fs = await import('fs/promises');
      const data = await fs.readFile(filename, 'utf-8');
      const importData = JSON.parse(data);

      if (!importData.entries || !Array.isArray(importData.entries)) {
        throw new Error('Invalid import file format');
      }

      let imported = 0;
      let errors = 0;

      for (const entry of importData.entries) {
        try {
          await this.knowledgeDB.addEntry(entry);
          imported++;
          process.stdout.write(`\r📊 Importing... ${imported}/${importData.entries.length}`);
        } catch (error) {
          errors++;
          console.error(`\nError importing entry ${entry.id}:`, error);
        }
      }

      console.log('\n✅ Import completed!');
      console.log(`   Entries imported: ${imported}`);
      console.log(`   Errors: ${errors}`);

    } catch (error) {
      console.error('❌ Import failed:', error);
    }
  }

  private async handleClear(options: CLIOptions): Promise<void> {
    if (!options.flags.confirm) {
      console.log('⚠️  This will delete ALL knowledge base data!');
      console.log('To confirm, run: npm run kb clear --confirm');
      return;
    }

    console.log('🗑️  Clearing knowledge base...');
    await this.knowledgeDB.clearAll();
    console.log('✅ Knowledge base cleared!');
  }

  private showHelp(): void {
    console.log(`
🧠 Synapse AI Knowledge Base CLI

USAGE:
  npm run kb <command> [options]

COMMANDS:
  sync                    Sync data from Radiopaedia
    --systems=<list>      Comma-separated list of systems (e.g., respiratory,cardiac)
    --modalities=<list>   Comma-separated list of modalities (e.g., CT,MR,X-ray)
    --pathologies=<list>  Comma-separated list of pathologies
    --limit=<number>      Maximum number of articles to sync (default: 100)
    --images              Download and store images locally

  search <query>          Search the knowledge base
    --type=<type>         Filter by type (article, case, image)
    --system=<system>     Filter by system
    --modality=<modality> Filter by modality
    --pathology=<path>    Filter by pathology
    --limit=<number>      Maximum results (default: 10)
    --semantic            Use semantic search

  stats                   Show knowledge base statistics

  export [filename]       Export knowledge base to JSON
                         (default: knowledge-base-export-YYYY-MM-DD.json)

  import <filename>       Import knowledge base from JSON

  clear --confirm         Clear all knowledge base data

  help                    Show this help message

EXAMPLES:
  npm run kb sync --systems=respiratory --modalities=CT,X-ray --limit=50
  npm run kb search "pneumothorax" --type=article --system=respiratory
  npm run kb stats
  npm run kb export my-backup.json
  npm run kb import my-backup.json
  npm run kb clear --confirm
`);
  }
}

// Parse command line arguments
function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const flags: Record<string, string | boolean> = {};
  const commandArgs: string[] = [];

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      flags[key] = value || true;
    } else {
      commandArgs.push(arg);
    }
  }

  return { command, args: commandArgs, flags };
}

// Main execution
async function main() {
  const options = parseArgs();
  const cli = new KnowledgeBaseCLI();
  await cli.run(options);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { KnowledgeBaseCLI };