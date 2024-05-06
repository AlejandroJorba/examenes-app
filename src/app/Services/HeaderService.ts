import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HeaderService {

  private data: any = {};

  setHeaderData(data: any): void {
    this.data = data;
  }

  getHeaderData(): any {
    return this.data;
  }

} 
