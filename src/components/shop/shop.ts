import { Component } from '@angular/core';

@Component({
  selector: 'app-shop',
  imports: [],
  templateUrl: './shop.html',
  styleUrl: './shop.css',
})
export class Shop {
  particles = Array.from({ length: 14 }, (_, i) => i);
}
