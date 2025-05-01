import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionMensajeriaComponent } from './gestion-mensajeria.component';

describe('GestionMensajeriaComponent', () => {
  let component: GestionMensajeriaComponent;
  let fixture: ComponentFixture<GestionMensajeriaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionMensajeriaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionMensajeriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
