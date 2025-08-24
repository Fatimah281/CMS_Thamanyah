import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../../../shared/src/lib/services/auth.service';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate() {
    return this.authService.user$.pipe(
      take(1),
      map(user => {
        if (user && this.authService.isAdmin()) {
          return true;
        } else {
          window.location.href = 'http://localhost:4201';
          return false;
        }
      })
    );
  }
}
