import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';


@Component({
  selector: 'app-main-layout',
  standalone: false,
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent {
  sidebarVisible = false;
  isMobile = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {

      this.checkScreenWidth();
      window.addEventListener('resize', () => this.checkScreenWidth());
    }
  }

  checkScreenWidth() {
    this.isMobile = window.innerWidth < 768;
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  closeSidebar() {
    this.sidebarVisible = false;
  }

  onNavigate() {
    if (this.isMobile) {
      this.sidebarVisible = false;
    }
  }
}
