import { TestBed } from '@angular/core/testing';

import { DataLoaderService } from './data-loader.service';

describe('DataLoaderService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DataLoaderService = TestBed.get(DataLoaderService);
    expect(service).toBeTruthy();
  });
});
