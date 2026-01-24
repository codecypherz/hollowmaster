import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OpenPack } from "../components/open-pack/open-pack";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, OpenPack],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('hollowmaster');
}
