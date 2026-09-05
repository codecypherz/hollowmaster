import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavShell } from '../components/nav-shell/nav-shell';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavShell],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
