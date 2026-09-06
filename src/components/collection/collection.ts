import { Component } from '@angular/core';
import { createParticleField, particleVars } from '../../model/particle';

@Component({
  selector: 'app-collection',
  imports: [],
  templateUrl: './collection.html',
  styleUrl: './collection.css',
})
export class Collection {
  particles = createParticleField(14, 0xc0115);
  readonly vars = particleVars;
}
