import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { createParticleField, particleVars } from '../../model/particle';

@Component({
  selector: 'app-battle',
  imports: [],
  templateUrl: './battle.html',
  styleUrl: './battle.css',
})
export class Battle {
  private readonly router = inject(Router);

  particles = createParticleField(22, 0x5eed);
  readonly vars = particleVars;

  /**
   * Beginning a battle starts nothing here: it leads to deck selection, and
   * the match is begun from there with the deck the player chooses.
   */
  chooseDeck(): void {
    this.router.navigate(['/battle/deck']);
  }
}
