import { Component } from '@angular/core';
import { createParticleField, particleVars } from '../../model/particle';

@Component({
  selector: 'app-shop',
  imports: [],
  templateUrl: './shop.html',
  styleUrl: './shop.css',
})
export class Shop {
  particles = createParticleField(14, 0x5409);
  readonly vars = particleVars;
}
