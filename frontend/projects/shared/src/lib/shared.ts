import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

export * from './services/auth.service';
export * from './services/auth.interceptor';
export * from './services/program.service';
export * from './services/category.service';
export * from './services/language.service';
export * from './services/video-upload.service';
export * from './services/youtube.service';

export * from './models/program.model';
export * from './models/category.model';
export * from './models/language.model';
export * from './models/user.model';

import { AuthInterceptor } from './services/auth.interceptor';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ]
})
export class SharedModule { }
