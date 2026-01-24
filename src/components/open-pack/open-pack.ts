import { Component } from '@angular/core';

@Component({
  selector: 'app-open-pack',
  templateUrl: './open-pack.html',
  styleUrl: './open-pack.css',
})
export class OpenPack {
  // 1. Start with an empty array
  cards: any[] = [];

  // 2. This function runs when the button is clicked
  openPack() {
    this.cards = [
      { title: 'Card 1', description: 'This is the first item.' },
      { title: 'Card 2', description: 'This is the second item.' },
      { title: 'Card 3', description: 'This is the third item.' }
    ];
  }
}
