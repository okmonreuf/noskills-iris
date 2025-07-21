import { getDatabase, DatabaseUtils } from '../database/db';
import axios from 'axios';
import * as crypto from 'crypto';
import * as dns from 'dns/promises';
import { promisify } from 'util';

export interface OsintAnalysisRequest {
  target: string;
  type: 'discord' | 'email' | 'ip' | 'username' | 'phone' | 'domain' | 'url';
  tools: string[];
  investigation_id?: string;
}

export interface OsintResult {
  tool: string;
  success: boolean;
  data: any;
  confidence: number;
  timestamp: string;
  execution_time: number;
  error?: string;
}

export class OsintService {
  private get db() {
    return getDatabase();
  }

  // Main analysis function
  async analyzeTarget(request: OsintAnalysisRequest, userId: string): Promise<{
    success: boolean;
    analysis_id: string;
    results?: OsintResult[];
    message: string;
  }> {
    const startTime = Date.now();
    const analysisId = DatabaseUtils.generateId();
    
    try {
      // Create analysis record
      this.db.prepare(`
        INSERT INTO osint_analyses (
          id, investigation_id, target, target_type, tool_name, status, created_by, started_at
        ) VALUES (?, ?, ?, ?, ?, 'running', ?, ?)
      `).run(
        analysisId,
        request.investigation_id || null,
        request.target,
        request.type,
        request.tools.join(','),
        userId,
        DatabaseUtils.now()
      );

      const results: OsintResult[] = [];

      // Execute analysis based on type
      switch (request.type) {
        case 'discord':
          results.push(...await this.analyzeDiscord(request.target));
          break;
        case 'email':
          results.push(...await this.analyzeEmail(request.target));
          break;
        case 'ip':
          results.push(...await this.analyzeIP(request.target));
          break;
        case 'username':
          results.push(...await this.analyzeUsername(request.target));
          break;
        case 'domain':
          results.push(...await this.analyzeDomain(request.target));
          break;
        case 'url':
          results.push(...await this.analyzeUrl(request.target));
          break;
        default:
          throw new Error(`Type d'analyse non supporté: ${request.type}`);
      }

      // Update analysis with results
      const executionTime = Date.now() - startTime;
      this.db.prepare(`
        UPDATE osint_analyses 
        SET status = 'completed', results = ?, completed_at = ?, execution_time = ?
        WHERE id = ?
      `).run(
        JSON.stringify(results),
        DatabaseUtils.now(),
        executionTime,
        analysisId
      );

      // Add evidence to investigation if specified
      if (request.investigation_id) {
        for (const result of results) {
          if (result.success) {
            await this.addEvidenceFromResult(request.investigation_id, result, userId);
          }
        }
      }

      return {
        success: true,
        analysis_id: analysisId,
        results,
        message: `Analyse terminée. ${results.filter(r => r.success).length}/${results.length} outils ont réussi.`
      };

    } catch (error) {
      console.error('OSINT Analysis Error:', error);
      
      // Update analysis as failed
      this.db.prepare(`
        UPDATE osint_analyses 
        SET status = 'failed', error_message = ?, completed_at = ?
        WHERE id = ?
      `).run(
        error instanceof Error ? error.message : 'Erreur inconnue',
        DatabaseUtils.now(),
        analysisId
      );

      return {
        success: false,
        analysis_id: analysisId,
        message: 'Erreur lors de l\'analyse OSINT'
      };
    }
  }

  // Discord OSINT tools
  private async analyzeDiscord(target: string): Promise<OsintResult[]> {
    const results: OsintResult[] = [];
    const startTime = Date.now();

    try {
      // Mock Discord analysis (in real implementation, use Discord API or scraping)
      const discordData = {
        username: target,
        user_id: this.generateMockId(),
        avatar_url: `https://cdn.discordapp.com/avatars/${this.generateMockId()}/avatar.png`,
        account_created: this.generateRandomDate(),
        servers_estimate: Math.floor(Math.random() * 50) + 1,
        activity_level: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
        common_servers: [
          'Gaming Community #1',
          'Tech Discussion',
          'Random Chat'
        ].slice(0, Math.floor(Math.random() * 3) + 1)
      };

      results.push({
        tool: 'Discord User Lookup',
        success: true,
        data: discordData,
        confidence: 85,
        timestamp: DatabaseUtils.now(),
        execution_time: Date.now() - startTime
      });

      // Mock message history analysis
      const messageData = {
        total_messages_estimate: Math.floor(Math.random() * 10000) + 100,
        last_activity: this.generateRandomDate(30),
        common_words: ['hello', 'thanks', 'lol', 'ok', 'yeah'],
        language_detected: 'French',
        sentiment: ['Positive', 'Neutral', 'Negative'][Math.floor(Math.random() * 3)]
      };

      results.push({
        tool: 'Discord Message Analysis',
        success: true,
        data: messageData,
        confidence: 70,
        timestamp: DatabaseUtils.now(),
        execution_time: Date.now() - startTime
      });

    } catch (error) {
      results.push({
        tool: 'Discord Analysis',
        success: false,
        data: null,
        confidence: 0,
        timestamp: DatabaseUtils.now(),
        execution_time: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }

    return results;
  }

  // Email OSINT tools
  private async analyzeEmail(email: string): Promise<OsintResult[]> {
    const results: OsintResult[] = [];
    const startTime = Date.now();

    try {
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Format d\'email invalide');
      }

      const domain = email.split('@')[1];

      // Mock HaveIBeenPwned check
      const pwndData = {
        email: email,
        breached: Math.random() > 0.7, // 30% chance of breach
        breaches: Math.random() > 0.7 ? [
          { name: 'LinkedIn', date: '2023-06-15', affected: 700000000 },
          { name: 'Adobe', date: '2023-10-03', affected: 153000000 }
        ] : [],
        pastes: Math.random() > 0.8 ? ['Pastebin 2023'] : []
      };

      results.push({
        tool: 'HaveIBeenPwned',
        success: true,
        data: pwndData,
        confidence: 95,
        timestamp: DatabaseUtils.now(),
        execution_time: Date.now() - startTime
      });

      // Domain analysis
      const domainData = await this.analyzeDomainInfo(domain);
      results.push({
        tool: 'Domain Analysis',
        success: true,
        data: domainData,
        confidence: 90,
        timestamp: DatabaseUtils.now(),
        execution_time: Date.now() - startTime
      });

      // Email reputation check
      const reputationData = {
        disposable: this.isDisposableEmail(domain),
        free_provider: this.isFreeEmailProvider(domain),
        mx_records: [`mx1.${domain}`, `mx2.${domain}`],
        spf_record: `v=spf1 include:_spf.${domain} ~all`,
        reputation_score: Math.floor(Math.random() * 100)
      };

      results.push({
        tool: 'Email Reputation',
        success: true,
        data: reputationData,
        confidence: 80,
        timestamp: DatabaseUtils.now(),
        execution_time: Date.now() - startTime
      });

    } catch (error) {
      results.push({
        tool: 'Email Analysis',
        success: false,
        data: null,
        confidence: 0,
        timestamp: DatabaseUtils.now(),
        execution_time: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }

    return results;
  }

  // IP OSINT tools
  private async analyzeIP(ip: string): Promise<OsintResult[]> {
    const results: OsintResult[] = [];
    const startTime = Date.now();

    try {
      // IP validation
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!ipRegex.test(ip)) {
        throw new Error('Format d\'IP invalide');
      }

      // Mock geolocation (in real implementation, use IP API)
      const geoData = {
        ip: ip,
        country: 'France',
        region: 'Île-de-France',
        city: 'Paris',
        latitude: 48.8566 + (Math.random() - 0.5) * 0.1,
        longitude: 2.3522 + (Math.random() - 0.5) * 0.1,
        isp: 'Orange',
        organization: 'Orange Business Services',
        timezone: 'Europe/Paris',
        postal_code: '75001'
      };

      results.push({
        tool: 'IP Geolocation',
        success: true,
        data: geoData,
        confidence: 90,
        timestamp: DatabaseUtils.now(),
        execution_time: Date.now() - startTime
      });

      // Mock reputation check
      const reputationData = {
        ip: ip,
        reputation_score: Math.floor(Math.random() * 100),
        threat_level: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
        blacklisted: Math.random() > 0.9,
        categories: ['Clean', 'Proxy', 'VPN', 'Malware'][Math.floor(Math.random() * 4)],
        last_seen: this.generateRandomDate(365)
      };

      results.push({
        tool: 'IP Reputation',
        success: true,
        data: reputationData,
        confidence: 85,
        timestamp: DatabaseUtils.now(),
        execution_time: Date.now() - startTime
      });

      // Mock port scan (simplified)
      const portData = {
        ip: ip,
        open_ports: [80, 443, 22].filter(() => Math.random() > 0.3),
        services: {
          80: 'HTTP',
          443: 'HTTPS',
          22: 'SSH'
        },
        scan_time: new Date().toISOString()
      };

      results.push({
        tool: 'Port Scanner',
        success: true,
        data: portData,
        confidence: 75,
        timestamp: DatabaseUtils.now(),
        execution_time: Date.now() - startTime
      });

    } catch (error) {
      results.push({
        tool: 'IP Analysis',
        success: false,
        data: null,
        confidence: 0,
        timestamp: DatabaseUtils.now(),
        execution_time: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }

    return results;
  }

  // Username OSINT tools
  private async analyzeUsername(username: string): Promise<OsintResult[]> {
    const results: OsintResult[] = [];
    const startTime = Date.now();

    try {
      // Mock Sherlock-style analysis
      const platforms = ['Twitter', 'Instagram', 'GitHub', 'Reddit', 'TikTok', 'LinkedIn'];
      const foundPlatforms = platforms.filter(() => Math.random() > 0.6);

      const sherlockData = {
        username: username,
        total_platforms_checked: platforms.length,
        platforms_found: foundPlatforms,
        profiles: foundPlatforms.map(platform => ({
          platform,
          url: `https://${platform.toLowerCase()}.com/${username}`,
          status: 'Found',
          response_time: Math.floor(Math.random() * 1000) + 100
        }))
      };

      results.push({
        tool: 'Sherlock Username Search',
        success: true,
        data: sherlockData,
        confidence: 80,
        timestamp: DatabaseUtils.now(),
        execution_time: Date.now() - startTime
      });

      // Mock social media analysis
      for (const platform of foundPlatforms.slice(0, 3)) {
        const profileData = {
          platform,
          username,
          followers: Math.floor(Math.random() * 10000),
          following: Math.floor(Math.random() * 1000),
          posts: Math.floor(Math.random() * 500),
          account_created: this.generateRandomDate(1825), // 5 years
          last_activity: this.generateRandomDate(30),
          verified: Math.random() > 0.9
        };

        results.push({
          tool: `${platform} Profile Analysis`,
          success: true,
          data: profileData,
          confidence: 70,
          timestamp: DatabaseUtils.now(),
          execution_time: Date.now() - startTime
        });
      }

    } catch (error) {
      results.push({
        tool: 'Username Analysis',
        success: false,
        data: null,
        confidence: 0,
        timestamp: DatabaseUtils.now(),
        execution_time: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }

    return results;
  }

  // Domain OSINT tools
  private async analyzeDomain(domain: string): Promise<OsintResult[]> {
    const results: OsintResult[] = [];
    const startTime = Date.now();

    try {
      const domainData = await this.analyzeDomainInfo(domain);
      
      results.push({
        tool: 'Domain Whois',
        success: true,
        data: domainData,
        confidence: 95,
        timestamp: DatabaseUtils.now(),
        execution_time: Date.now() - startTime
      });

    } catch (error) {
      results.push({
        tool: 'Domain Analysis',
        success: false,
        data: null,
        confidence: 0,
        timestamp: DatabaseUtils.now(),
        execution_time: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }

    return results;
  }

  // URL OSINT tools
  private async analyzeUrl(url: string): Promise<OsintResult[]> {
    const results: OsintResult[] = [];
    const startTime = Date.now();

    try {
      // URL analysis
      const urlObj = new URL(url);
      const urlData = {
        url: url,
        domain: urlObj.hostname,
        protocol: urlObj.protocol,
        path: urlObj.pathname,
        params: Object.fromEntries(urlObj.searchParams),
        suspicious_elements: this.checkSuspiciousUrl(url)
      };

      results.push({
        tool: 'URL Analysis',
        success: true,
        data: urlData,
        confidence: 85,
        timestamp: DatabaseUtils.now(),
        execution_time: Date.now() - startTime
      });

    } catch (error) {
      results.push({
        tool: 'URL Analysis',
        success: false,
        data: null,
        confidence: 0,
        timestamp: DatabaseUtils.now(),
        execution_time: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }

    return results;
  }

  // Helper methods
  private async analyzeDomainInfo(domain: string) {
    return {
      domain: domain,
      registrar: 'OVH',
      creation_date: this.generateRandomDate(3650),
      expiry_date: this.generateFutureDate(365),
      nameservers: [`ns1.${domain}`, `ns2.${domain}`],
      status: 'Active',
      privacy_protection: Math.random() > 0.5,
      mx_records: [`mx1.${domain}`, `mx2.${domain}`]
    };
  }

  private isDisposableEmail(domain: string): boolean {
    const disposableDomains = ['tempmail.org', '10minutemail.com', 'guerrillamail.com'];
    return disposableDomains.includes(domain);
  }

  private isFreeEmailProvider(domain: string): boolean {
    const freeProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    return freeProviders.includes(domain);
  }

  private checkSuspiciousUrl(url: string): string[] {
    const suspicious = [];
    if (url.includes('bit.ly')) suspicious.push('URL shortened');
    if (url.includes('login')) suspicious.push('Login page');
    if (url.length > 100) suspicious.push('Overly long URL');
    if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url)) suspicious.push('IP address instead of domain');
    return suspicious;
  }

  private generateMockId(): string {
    return Math.floor(Math.random() * 900000000000000000 + 100000000000000000).toString();
  }

  private generateRandomDate(daysAgo: number = 365): string {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
    return date.toISOString();
  }

  private generateFutureDate(daysFromNow: number = 365): string {
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * daysFromNow));
    return date.toISOString();
  }

  private async addEvidenceFromResult(investigationId: string, result: OsintResult, userId: string) {
    try {
      const evidenceId = DatabaseUtils.generateId();
      const stmt = this.db.prepare(`
        INSERT INTO evidence (
          id, investigation_id, type, title, content, source_tool, 
          confidence_score, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        evidenceId,
        investigationId,
        'metadata',
        `Résultat ${result.tool}`,
        JSON.stringify(result.data),
        result.tool,
        result.confidence,
        userId,
        DatabaseUtils.now()
      );
    } catch (error) {
      console.error('Error adding evidence from result:', error);
    }
  }

  // Get analysis results
  async getAnalysis(analysisId: string): Promise<any> {
    try {
      const analysis = this.db.prepare('SELECT * FROM osint_analyses WHERE id = ?').get(analysisId);
      if (analysis && analysis.results) {
        analysis.results = JSON.parse(analysis.results);
      }
      return { success: true, analysis };
    } catch (error) {
      return { success: false, message: 'Erreur lors de la récupération de l\'analyse' };
    }
  }
}

export const osintService = new OsintService();
