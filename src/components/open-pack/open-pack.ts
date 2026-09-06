import { Component } from '@angular/core';
import { Card, CARD_DB } from '../../model/card';
import { CardComponent } from '../card/card';
import { createParticleField, particleVars } from '../../model/particle';

@Component({
  selector: 'app-open-pack',
  imports: [CardComponent],
  templateUrl: './open-pack.html',
  styleUrl: './open-pack.css',
})
export class OpenPack {
  cards: Card[] = [];

  readonly particles = createParticleField(18, 0x09ac);
  readonly vars = particleVars;

  openPack() {
    const arr = [];
    for (let i = 0; i < 6; i++) {
      const pip = Math.floor(Math.random() * CARD_DB.length);
      arr.push(CARD_DB[pip]);
    }

    this.cards = arr;
  }
}
