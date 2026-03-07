import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-register',
  templateUrl: './register.html',
  imports: [CommonModule, FormsModule, RouterModule],
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  role = '';

  // validation flags
  passwordValid = {
    minLength: false,
    uppercase: false,
    number: false,
    specialChar: false,
  };
  passwordsMatch = false;

  submitting = false;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  checkPassword() {
    this.passwordValid.minLength = this.password.length >= 8;
    this.passwordValid.uppercase = /[A-Z]/.test(this.password);
    this.passwordValid.number = /\d/.test(this.password);
    this.passwordValid.specialChar = /[!@#$%^&*(),.?":{}|<>]/.test(this.password);

    this.checkConfirmPassword();
  }

  checkConfirmPassword() {
    this.passwordsMatch = this.password === this.confirmPassword && this.confirmPassword.length > 0;
  }

  isPasswordValid(): boolean {
    return Object.values(this.passwordValid).every(Boolean);
  }

  isEmailValid(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }

  isFormValid(): boolean {
    return (
      this.name.trim().length > 0 &&
      this.isEmailValid() &&
      this.role.trim().length > 0 &&
      this.isPasswordValid() &&
      this.passwordsMatch
    );
  }

  submit() {
    if (!this.isFormValid()) {
      alert('Please fix validation errors before submitting.');
      return;
    }

    this.submitting = true;

    this.http
      .post(`${environment.apiUrl}/auth/register`, {
        name: this.name.trim(),
        email: this.email.trim(),
        password: this.password,
        role: this.role,
      })
      .subscribe({
        next: () => {
          this.submitting = false;
          this.showNotification(
            'success',
            '🎉 Registration Successful!',
            'Welcome to FarmChainX! Please sign in.',
          );
          setTimeout(() => this.router.navigate(['/login']), 1800);
        },
        error: (err) => {
          this.submitting = false;
          console.error('REGISTER ERROR →', err);
          this.showNotification(
            'error',
            '❌ Registration Failed',
            err?.error?.message || 'Something went wrong',
          );
        },
      });
  }
  notification: { type: string; title: string; message: string } | null = null;

  showNotification(type: string, title: string, message: string) {
    this.notification = { type, title, message };
    setTimeout(() => (this.notification = null), 3500);
  }
}
