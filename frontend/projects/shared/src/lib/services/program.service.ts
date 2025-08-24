import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Program, ProgramFormData } from '../models/program.model';
import { environment } from '../../environments/environment';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ProgramService {
  private readonly apiUrl = `${environment.apiUrl}/programs`;

  constructor(private http: HttpClient) {}

  getPrograms(page: number = 1, limit: number = 10, filters?: any): Observable<PaginatedResponse<Program>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined) {
          params = params.set(key, filters[key].toString());
        }
      });
    }

    return this.http.get<PaginatedResponse<Program>>(this.apiUrl, { params });
  }

  getProgram(id: string | number): Observable<Program | null> {
    const idString = id.toString();
    return this.http.get<any>(`${this.apiUrl}/${idString}`).pipe(
      map(response => {
        if (response && response.success && response.data) {
          return response.data as Program;
        }
        return null;
      }),
      catchError(() => of(null))
    );
  }

  createProgram(programData: ProgramFormData): Observable<Program> {
    return this.http.post<Program>(this.apiUrl, programData);
  }

  updateProgram(id: string | number, programData: ProgramFormData): Observable<Program> {
    const idString = id.toString();
    return this.http.patch<Program>(`${this.apiUrl}/${idString}`, programData);
  }

  deleteProgram(id: string | number): Observable<void> {
    const idString = id.toString();
    return this.http.delete<void>(`${this.apiUrl}/${idString}`);
  }

  searchPrograms(searchTerm: string, page: number = 1, limit: number = 10): Observable<PaginatedResponse<Program>> {
    const params = new HttpParams()
      .set('q', searchTerm)
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<PaginatedResponse<Program>>(`${this.apiUrl}/search`, { params });
  }

  getProgramsByCategory(categoryId: number, page: number = 1, limit: number = 10): Observable<PaginatedResponse<Program>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<PaginatedResponse<Program>>(`${this.apiUrl}/categories/${categoryId}`, { params });
  }

  getProgramsByLanguage(languageId: number, page: number = 1, limit: number = 10): Observable<PaginatedResponse<Program>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<PaginatedResponse<Program>>(`${this.apiUrl}/languages/${languageId}`, { params });
  }

  incrementViewCount(id: string | number): Observable<void> {
    const idString = id.toString();
    return this.http.post<void>(`${this.apiUrl}/${idString}/view`, {});
  }

  uploadVideo(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('video', file);
    return this.http.post(`${this.apiUrl}/upload`, formData);
  }
}
