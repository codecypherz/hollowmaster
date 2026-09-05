import { Component } from '@angular/core';

@Component({
  selector: 'app-collection',
  imports: [],
  templateUrl: './collection.html',
  styleUrl: './collection.css',
})
export class Collection {
  particles = Array.from({ length: 14 }, (_, i) => i);
}
