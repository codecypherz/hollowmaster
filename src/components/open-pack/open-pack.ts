import { Component } from '@angular/core';
import { Card, CARD_DB } from '../../model/card';

@Component({
  selector: 'app-open-pack',
  templateUrl: './open-pack.html',
  styleUrl: './open-pack.css',
})
export class OpenPack {

  // 1. Start with an empty array
  cards: Card[] = [];

  // 2. This function runs when the button is clicked
  openPack() {
    const arr = [];
    for (let i = 0; i < 6; i++) {
      const pip = Math.floor(Math.random() * (CARD_DB.length));
      arr.push(CARD_DB[pip]);
    }

    this.cards = arr;
  }
}
