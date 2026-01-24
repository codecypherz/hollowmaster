import { Component } from '@angular/core';
import { Card } from '../../model/card';

@Component({
  selector: 'app-open-pack',
  templateUrl: './open-pack.html',
  styleUrl: './open-pack.css',
})
export class OpenPack {


  private readonly cardpool: Card[] = [
    { name: 'Crawlid', rarity: 1 },
    { name: 'Gruz Mother', rarity: 3 },
    { name: 'Vengefly King', rarity: 3 },
    { name: 'Aspid Hunter', rarity: 2 },
    { name: 'Aspid Mother', rarity: 2 },
    { name: 'Goam', rarity: 3 },
    { name: 'Vengefly', rarity: 1 },
    { name: 'Gruzzer', rarity: 1 },
    { name: 'Tiktik', rarity: 1 },
    { name: 'Aspid Hatchling', rarity: 1 },
    { name: 'Wandering Husk', rarity: 1 },
    { name: 'Husk Hornhead', rarity: 1 },
    { name: 'Leaping Husk', rarity: 1 },
    { name: 'Husk Bully', rarity: 1 },
    { name: 'Husk Warrior', rarity: 2 }
  ];
  // 1. Start with an empty array
  cards: Card[] = [];

  // 2. This function runs when the button is clicked
  openPack() {
    const arr = [];
    for (let i = 0; i < 6; i++) {
      const pip = Math.floor(Math.random() * (this.cardpool.length));
      arr.push(this.cardpool[pip]);
    }

    this.cards = arr;
  }


  shuffleArray<T>(array: T[]): T[] {
    // Create a copy to avoid mutating the original array
    const shuffled = [...array]; 
  
    for (let i = shuffled.length - 1; i > 0; i--) {
      // Generate a random index from 0 to i
      const j = Math.floor(Math.random() * (i + 1));
      
      // Swap elements using destructuring assignment
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
  
    return shuffled;
  }
}
