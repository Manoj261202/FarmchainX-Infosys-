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
  errorMessage = '';

  constructor(private http: HttpClient, private router: Router) { }

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
      this.errorMessage = '❌ Please fix all validation errors before submitting.';
      alert(this.errorMessage);
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    this.http
      .post(`${environment.apiUrl}/auth/register`, {
        name: this.name.trim(),
        email: this.email.trim(),
        password: this.password,
        role: this.role,
      })
      .subscribe({
        next: (response) => {
          this.submitting = false;
          console.log('Registration successful:', response);
          alert('✅ Registration successful! Redirecting to login...');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.submitting = false;
          console.error('REGISTER ERROR →', err);
          
          // Extract error message from different response formats
          let errorMsg = 'Registration failed';
          
          if (err.error?.message) {
            errorMsg = err.error.message;
          } else if (err.error?.error) {
            errorMsg = err.error.error;
          } else if (err.error?.['message']) {
            errorMsg = err.error['message'];
          } else if (typeof err.error === 'string') {
            errorMsg = err.error;
          } else if (err.status) {
            if (err.status === 0) {
              errorMsg = '❌ Cannot connect to backend. Make sure backend is running on http://localhost:8080';
            } else if (err.status === 400) {
              errorMsg = '❌ ' + (err.error?.message || 'Invalid form data');
            } else if (err.status === 409) {
              errorMsg = '❌ Email already exists!';
            } else {
              errorMsg = `❌ Server error (${err.status}): ${err.error?.message || 'Unknown error'}`;
            }
          }
          
          this.errorMessage = errorMsg;
          console.error('Error details:', errorMsg);
          alert(errorMsg);
        },
      });
  }
}
