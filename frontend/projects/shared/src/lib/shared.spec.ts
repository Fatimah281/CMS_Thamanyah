import { TestBed } from '@angular/core/testing';
import { SharedModule } from './shared';

describe('SharedModule', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule]
    }).compileComponents();
  });

  it('should create', () => {
    expect(SharedModule).toBeTruthy();
  });
});
