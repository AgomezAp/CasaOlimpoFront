import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DescuentoDashboardComponent } from './descuento-dashboard.component';

describe('DescuentoDashboardComponent', () => {
  let component: DescuentoDashboardComponent;
  let fixture: ComponentFixture<DescuentoDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DescuentoDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DescuentoDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
