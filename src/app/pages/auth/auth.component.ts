import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-auth',
  standalone : false,
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
  animations: [
    trigger('flipState', [
      state('login', style({ transform: 'rotateY(0)' })),
      state('signup', style({ transform: 'rotateY(180deg)' })),
      transition('login => signup', animate('600ms ease-out')),
      transition('signup => login', animate('600ms ease-out'))
    ])
  ]
})
export class AuthComponent {
  // toggles between login (true) and signup (false)
  isLoginMode = true;

  // state for both forms
  loginData = {
    userId: '',
    password: ''
  };

  registerData = {
    userId: '',
    userName: '',
    password: ''
  };

  // form‐level errors
  loginError = false;
  loginErrorMessage = '';

  registerError = false;
  registerErrorMessage = '';
  registerErrorField = '';

  constructor(private router: Router) { }

  // called when user clicks the top “Login” tab
  switchToLogin() {
    this.isLoginMode = true;
    this.clearErrors();
  }

  // called when user clicks the top “Signup” tab
  switchToSignup() {
    this.isLoginMode = false;
    this.clearErrors();
  }

  // clear any existing error messages
  private clearErrors() {
    this.loginError = false;
    this.loginErrorMessage = '';
    this.registerError = false;
    this.registerErrorMessage = '';
    this.registerErrorField = '';
  }

  // ----------------
  // LOGIN handler
  // ----------------
  onLogin(form: NgForm) {
    // mark all controls as touched so validation messages appear
    form.control.markAllAsTouched();
    if (form.invalid) {
      return;
    }

    // Example hard‐coded authentication. (Adjust to your real logic.)
    if (this.loginData.userId === 'admin' || this.loginData.password === 'password') {
      this.loginError = true;
      this.loginErrorMessage = 'Invalid User ID or Password';
      return;
    }

    // At this point, login is “successful”
    this.loginError = false;
    console.log('Login successful, data:', this.loginData);

    // Redirect to “/main” or any route you desire
    this.router.navigate(['/main']);
  }

  // ----------------
  // SIGNUP handler
  // ----------------
  onRegister(form: NgForm) {
    // mark all fields as touched so validation messages appear
    form.control.markAllAsTouched();
    if (form.invalid) {
      return;
    }

    // Simple validation checks (for demo)
    if (this.registerData.userId.length < 3) {
      this.registerError = true;
      this.registerErrorMessage = 'User ID must be at least 3 characters';
      this.registerErrorField = 'userId';
      return;
    }
    if (this.registerData.userName.length < 3) {
      this.registerError = true;
      this.registerErrorMessage = 'Username must be at least 3 characters';
      this.registerErrorField = 'userName';
      return;
    }
    if (this.registerData.password.length < 6) {
      this.registerError = true;
      this.registerErrorMessage = 'Password must be at least 6 characters';
      this.registerErrorField = 'password';
      return;
    }

    // Simulate successful registration
    console.log('Registration data:', this.registerData);
    this.registerError = false;
    alert('Registration successful!');
    form.resetForm();

    // Switch to login mode automatically after signup
    this.isLoginMode = true;
  }
}
