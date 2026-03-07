import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface SystemSettings {
  applicationVersion: string;
  databaseStatus: string;
  uptime: number;
  totalUsers: number;
  totalProducts: number;
  totalTransactions: number;
  registrationEnabled: boolean;
  maintenanceMode: boolean;
  emailNotificationsEnabled: boolean;
  maxUploadSize: number;
  sessionTimeout: number;
  defaultUserRole: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-admin-settings',
  templateUrl: './admin-settings.html',
})
export class AdminSettings implements OnInit {
  settings: SystemSettings | null = null;
  isLoading = false;
  isSaving = false;
  saveSuccess = false;
  saveError = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.isLoading = true;
    this.http.get<SystemSettings>('/api/admin/settings').subscribe({
      next: (data) => {
        this.settings = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load settings:', err);
        this.isLoading = false;
      },
    });
  }

  saveSettings(): void {
    if (!this.settings) return;
    this.isSaving = true;
    this.saveSuccess = false;
    this.saveError = '';

    this.http.post<SystemSettings>('/api/admin/settings', this.settings).subscribe({
      next: (data) => {
        this.settings = data;
        this.isSaving = false;
        this.saveSuccess = true;
        setTimeout(() => (this.saveSuccess = false), 3000);
      },
      error: (err) => {
        console.error('Failed to save settings:', err);
        this.isSaving = false;
        this.saveError = 'Failed to save settings. Please try again.';
        setTimeout(() => (this.saveError = ''), 3000);
      },
    });
  }

  formatUptime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  }
}
