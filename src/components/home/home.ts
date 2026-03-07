import { Component, output } from '@angular/core';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  particles = Array.from({ length: 22 }, (_, i) => i);
  readonly startGame = output<void>();
}
