/**
 * MCP Server Registry - Server Installer
 */

import { join } from 'path';
import { execSync } from 'child_process';
import { 
  existsSync, 
  mkdirSync, 
  writeFileSync, 
  readFileSync,
  rmSync
} from 'fs';
import type { MCPServerManifest, InstalledServer } from './types.js';
import { getConfig, ensureDirectories } from './config.js';

const INSTALLED_DB = 'installed.json';

export class Installer {
  private installDir: string;
  
  constructor() {
    this.installDir = getConfig().installDir;
  }
  
  /**
   * Install a server from its manifest
   */
  async install(manifest: MCPServerManifest): Promise<InstalledServer> {
    ensureDirectories();
    
    const serverDir = join(this.installDir, manifest.id);
    
    if (existsSync(serverDir)) {
      throw new Error(`Server ${manifest.id} is already installed. Use 'update' instead.`);
    }
    
    mkdirSync(serverDir, { recursive: true });
    
    // Install based on runtime type
    switch (manifest.runtime.type) {
      case 'node':
        await this.installNode(manifest, serverDir);
        break;
      case 'python':
        await this.installPython(manifest, serverDir);
        break;
      case 'docker':
        await this.installDocker(manifest, serverDir);
        break;
      case 'binary':
        await this.installBinary(manifest, serverDir);
        break;
    }
    
    // Save manifest locally
    writeFileSync(
      join(serverDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
    
    // Record installation
    const installed: InstalledServer = {
      id: manifest.id,
      version: manifest.version,
      path: serverDir,
      installedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    this.addToInstalledDb(installed);
    
    return installed;
  }
  
  /**
   * Update an installed server
   */
  async update(manifest: MCPServerManifest): Promise<InstalledServer> {
    const serverDir = join(this.installDir, manifest.id);
    
    if (!existsSync(serverDir)) {
      throw new Error(`Server ${manifest.id} is not installed. Use 'install' first.`);
    }
    
    // Remove and reinstall
    await this.remove(manifest.id);
    return this.install(manifest);
  }
  
  /**
   * Remove an installed server
   */
  async remove(serverId: string): Promise<void> {
    const serverDir = join(this.installDir, serverId);
    
    if (!existsSync(serverDir)) {
      throw new Error(`Server ${serverId} is not installed.`);
    }
    
    rmSync(serverDir, { recursive: true, force: true });
    this.removeFromInstalledDb(serverId);
  }
  
  /**
   * List installed servers
   */
  listInstalled(): InstalledServer[] {
    const dbPath = join(this.installDir, INSTALLED_DB);
    
    if (!existsSync(dbPath)) {
      return [];
    }
    
    try {
      return JSON.parse(readFileSync(dbPath, 'utf-8'));
    } catch {
      return [];
    }
  }
  
  /**
   * Get an installed server
   */
  getInstalled(serverId: string): InstalledServer | null {
    const installed = this.listInstalled();
    return installed.find(s => s.id === serverId) || null;
  }
  
  /**
   * Check if a server is installed
   */
  isInstalled(serverId: string): boolean {
    return this.getInstalled(serverId) !== null;
  }
  
  /**
   * Get the command to run a server
   */
  getRunCommand(serverId: string): string | null {
    const installed = this.getInstalled(serverId);
    if (!installed) return null;
    
    const manifestPath = join(installed.path, 'manifest.json');
    const manifest: MCPServerManifest = JSON.parse(
      readFileSync(manifestPath, 'utf-8')
    );
    
    const serverDir = installed.path;
    
    switch (manifest.runtime.type) {
      case 'node':
        return `node ${join(serverDir, manifest.runtime.entry)}`;
      case 'python':
        return `python ${join(serverDir, manifest.runtime.entry)}`;
      case 'docker':
        return `docker run ${manifest.installation.dockerImage}`;
      case 'binary':
        return join(serverDir, manifest.runtime.entry);
      default:
        return null;
    }
  }
  
  private async installNode(manifest: MCPServerManifest, serverDir: string): Promise<void> {
    if (manifest.installation.npmPackage) {
      execSync(`npm install ${manifest.installation.npmPackage}`, {
        cwd: serverDir,
        stdio: 'pipe',
      });
    } else if (manifest.installation.githubRepo) {
      execSync(`git clone ${manifest.installation.githubRepo} .`, {
        cwd: serverDir,
        stdio: 'pipe',
      });
      execSync('npm install', {
        cwd: serverDir,
        stdio: 'pipe',
      });
    } else {
      throw new Error('No installation method available for this server');
    }
  }
  
  private async installPython(manifest: MCPServerManifest, serverDir: string): Promise<void> {
    if (manifest.installation.pypiPackage) {
      execSync(`pip install ${manifest.installation.pypiPackage} -t .`, {
        cwd: serverDir,
        stdio: 'pipe',
      });
    } else if (manifest.installation.githubRepo) {
      execSync(`git clone ${manifest.installation.githubRepo} .`, {
        cwd: serverDir,
        stdio: 'pipe',
      });
      execSync('pip install -e .', {
        cwd: serverDir,
        stdio: 'pipe',
      });
    } else {
      throw new Error('No installation method available for this server');
    }
  }
  
  private async installDocker(manifest: MCPServerManifest, serverDir: string): Promise<void> {
    if (!manifest.installation.dockerImage) {
      throw new Error('Docker image not specified');
    }
    
    execSync(`docker pull ${manifest.installation.dockerImage}`, {
      stdio: 'pipe',
    });
    
    // Save docker-compose or run config
    writeFileSync(
      join(serverDir, 'docker-compose.yml'),
      `services:\n  ${manifest.id}:\n    image: ${manifest.installation.dockerImage}\n`
    );
  }
  
  private async installBinary(manifest: MCPServerManifest, serverDir: string): Promise<void> {
    if (manifest.installation.githubRepo) {
      // Download latest release
      // This is a simplified version - real implementation would use GitHub API
      throw new Error('Binary installation from GitHub not yet implemented');
    } else {
      throw new Error('No installation method available for this server');
    }
  }
  
  private addToInstalledDb(server: InstalledServer): void {
    const installed = this.listInstalled();
    const existing = installed.findIndex(s => s.id === server.id);
    
    if (existing >= 0) {
      installed[existing] = server;
    } else {
      installed.push(server);
    }
    
    const dbPath = join(this.installDir, INSTALLED_DB);
    writeFileSync(dbPath, JSON.stringify(installed, null, 2));
  }
  
  private removeFromInstalledDb(serverId: string): void {
    const installed = this.listInstalled().filter(s => s.id !== serverId);
    const dbPath = join(this.installDir, INSTALLED_DB);
    writeFileSync(dbPath, JSON.stringify(installed, null, 2));
  }
}
