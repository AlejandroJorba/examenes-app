import { ViewportScroller } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {

  constructor(private router: Router, private viewportScroller: ViewportScroller) {}

  scrollTo(fragment: string) {
    // Navega al componente si es necesario
    this.router.navigate(['/']).then(() => {
      // Hacer scroll al ID específico
      this.viewportScroller.scrollToAnchor(fragment);
    });
  }
}
