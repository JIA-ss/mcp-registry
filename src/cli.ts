#!/usr/bin/env node
/**
 * MCP Server Registry - CLI
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { RegistryClient } from './registry.js';
import { Installer } from './installer.js';
import { getConfig, setConfig, ensureDirectories } from './config.js';

const program = new Command();
const pkg = {
  name: '@oss-ai/mcp-registry',
  version: '0.1.0',
  description: 'npm-like registry for Model Context Protocol servers',
};

program
  .name('mcp-registry')
  .description(pkg.description)
  .version(pkg.version);

// Search command
program
  .command('search')
  .description('Search for MCP servers')
  .argument('<query>', 'Search query')
  .option('-p, --page <number>', 'Page number', '1')
  .option('-l, --limit <number>', 'Results per page', '20')
  .action(async (query, options) => {
    const spinner = ora('Searching registry...').start();
    
    try {
      const client = new RegistryClient();
      const results = await client.search(query, {
        page: parseInt(options.page),
        pageSize: parseInt(options.limit),
      });
      
      spinner.stop();
      
      if (results.servers.length === 0) {
        console.log(chalk.yellow('No servers found matching your query.'));
        return;
      }
      
      console.log(chalk.bold(`\nFound ${results.total} server(s):\n`));
      
      for (const server of results.servers) {
        console.log(`${chalk.cyan(server.name)} ${chalk.gray(`v${server.version}`)}`);
        console.log(`  ${server.description}`);
        console.log(`  ${chalk.gray(`by ${server.author.name} • ${server.stats?.downloads || 0} downloads • ⭐ ${server.stats?.rating.toFixed(1) || 'N/A'}`)}`);
        console.log(`  ${chalk.gray(`Install: mcp-registry install ${server.id}`)}`);
        console.log();
      }
      
      console.log(chalk.gray(`Page ${results.page} of ${Math.ceil(results.total / results.pageSize)}`));
    } catch (error) {
      spinner.fail(`Search failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// List command
program
  .command('list')
  .alias('ls')
  .description('List all available servers')
  .option('-p, --page <number>', 'Page number', '1')
  .option('-l, --limit <number>', 'Results per page', '20')
  .action(async (options) => {
    const spinner = ora('Fetching registry...').start();
    
    try {
      const client = new RegistryClient();
      const results = await client.list({
        page: parseInt(options.page),
        pageSize: parseInt(options.limit),
      });
      
      spinner.stop();
      
      console.log(chalk.bold(`\nAvailable servers (${results.total} total):\n`));
      
      for (const server of results.servers) {
        console.log(`${chalk.cyan(server.name)} ${chalk.gray(`v${server.version}`)}`);
        console.log(`  ${server.description}`);
        console.log();
      }
    } catch (error) {
      spinner.fail(`Failed to list servers: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Install command
program
  .command('install')
  .alias('i')
  .description('Install an MCP server')
  .argument('<server-id>', 'Server ID to install')
  .action(async (serverId) => {
    const spinner = ora(`Installing ${serverId}...`).start();
    
    try {
      const client = new RegistryClient();
      const installer = new Installer();
      
      const manifest = await client.getManifest(serverId);
      await installer.install(manifest);
      
      spinner.succeed(`Installed ${chalk.cyan(manifest.name)} v${manifest.version}`);
      
      // Show configuration info
      console.log(chalk.gray('\nConfiguration:'));
      if (manifest.runtime.env && manifest.runtime.env.length > 0) {
        console.log(chalk.yellow('Required environment variables:'));
        for (const env of manifest.runtime.env) {
          console.log(`  - ${env}`);
        }
      }
      
      const runCommand = installer.getRunCommand(serverId);
      if (runCommand) {
        console.log(chalk.gray(`\nRun command: ${runCommand}`));
      }
    } catch (error) {
      spinner.fail(`Installation failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Update command
program
  .command('update')
  .alias('up')
  .description('Update an installed MCP server')
  .argument('<server-id>', 'Server ID to update')
  .action(async (serverId) => {
    const spinner = ora(`Updating ${serverId}...`).start();
    
    try {
      const client = new RegistryClient();
      const installer = new Installer();
      
      const manifest = await client.getManifest(serverId);
      await installer.update(manifest);
      
      spinner.succeed(`Updated ${chalk.cyan(manifest.name)} to v${manifest.version}`);
    } catch (error) {
      spinner.fail(`Update failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Remove command
program
  .command('remove')
  .alias('rm')
  .description('Remove an installed MCP server')
  .argument('<server-id>', 'Server ID to remove')
  .action(async (serverId) => {
    const spinner = ora(`Removing ${serverId}...`).start();
    
    try {
      const installer = new Installer();
      await installer.remove(serverId);
      
      spinner.succeed(`Removed ${chalk.cyan(serverId)}`);
    } catch (error) {
      spinner.fail(`Removal failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Info command
program
  .command('info')
  .description('Show detailed information about a server')
  .argument('<server-id>', 'Server ID')
  .action(async (serverId) => {
    try {
      const client = new RegistryClient();
      const manifest = await client.getManifest(serverId);
      
      console.log(chalk.bold(`\n${manifest.name}`));
      console.log(chalk.gray(`v${manifest.version}`));
      console.log();
      console.log(manifest.description);
      console.log();
      
      console.log(chalk.bold('Author:'), manifest.author.name);
      if (manifest.homepage) console.log(chalk.bold('Homepage:'), manifest.homepage);
      if (manifest.repository) console.log(chalk.bold('Repository:'), manifest.repository);
      console.log(chalk.bold('License:'), manifest.license);
      console.log(chalk.bold('MCP Version:'), manifest.mcpVersion);
      console.log();
      
      if (manifest.keywords.length > 0) {
        console.log(chalk.bold('Keywords:'), manifest.keywords.join(', '));
      }
      
      if (manifest.capabilities.length > 0) {
        console.log(chalk.bold('\nCapabilities:'));
        for (const cap of manifest.capabilities) {
          console.log(`  ${chalk.cyan(cap.type)}: ${cap.name}`);
          console.log(`    ${cap.description}`);
        }
      }
      
      if (manifest.stats) {
        console.log(chalk.bold('\nStats:'));
        console.log(`  Downloads: ${manifest.stats.downloads}`);
        console.log(`  Rating: ${manifest.stats.rating.toFixed(1)}/5 (${manifest.stats.reviewCount} reviews)`);
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      process.exit(1);
    }
  });

// Config command
program
  .command('config')
  .description('View or set configuration')
  .option('--get <key>', 'Get a config value')
  .option('--set <key>', 'Set a config value')
  .option('--value <value>', 'Value to set')
  .action((options) => {
    if (options.get) {
      const config = getConfig();
      console.log((config as Record<string, unknown>)[options.get]);
    } else if (options.set && options.value) {
      setConfig({ [options.set]: options.value });
      console.log(chalk.green(`Set ${options.set} = ${options.value}`));
    } else {
      const config = getConfig();
      console.log(chalk.bold('Current configuration:'));
      console.log(JSON.stringify(config, null, 2));
    }
  });

// Init command
program
  .command('init')
  .description('Initialize MCP registry configuration')
  .action(() => {
    ensureDirectories();
    console.log(chalk.green('✓ MCP Registry initialized'));
    console.log(chalk.gray(`Config directory: ${getConfig().installDir}`));
  });

program.parse();
