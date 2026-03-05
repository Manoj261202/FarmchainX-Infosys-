import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.html',
  imports: [CommonModule, FormsModule, RouterModule],
})
export class Login {
  email = '';
  password = '';
  showPassword = false;
  bgImage = 'assets/farmpic1.jpg';

  constructor(
    private http: HttpClient,
    private router: Router,
    private auth: AuthService, // ✔ Inject AuthService
  ) {}

  login() {
    this.http
      .post<any>(`${environment.apiUrl}/auth/login`, {
        email: this.email,
        password: this.password,
      })
      .subscribe({
        next: (res) => {
          this.auth.setAuthFromResponse(res);
          this.showNotification('success', '✅ Login Successful!', 'Welcome back to FarmChainX');
          setTimeout(() => this.router.navigate(['/dashboard']), 1800);
        },
        error: (err) => {
          const msg = err?.error?.error || 'Invalid email or password';
          this.showNotification('error', '❌ Login Failed', msg);
        },
      });
  }

  notification: { type: string; title: string; message: string } | null = null;

  showNotification(type: string, title: string, message: string) {
    this.notification = { type, title, message };
    setTimeout(() => (this.notification = null), 3500);
  }
}
