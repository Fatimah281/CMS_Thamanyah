import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Language } from '../models/language.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly apiUrl = `${environment.apiUrl}/languages`;

  constructor(private http: HttpClient) {}

  getLanguages(): Observable<Language[]> {
    return this.http.get<{ data: Language[] }>(this.apiUrl).pipe(
      map(response => response.data || []),
      catchError(() => of([]))
    );
  }

  getLanguage(id: string): Observable<Language | null> {
    return this.http.get<Language>(`${this.apiUrl}/${id}`).pipe(
      catchError(() => of(null))
    );
  }

  createLanguage(language: Omit<Language, 'id'>): Observable<Language> {
    return this.http.post<Language>(this.apiUrl, language);
  }

  updateLanguage(id: string, language: Partial<Language>): Observable<Language> {
    return this.http.patch<Language>(`${this.apiUrl}/${id}`, language);
  }

  deleteLanguage(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
