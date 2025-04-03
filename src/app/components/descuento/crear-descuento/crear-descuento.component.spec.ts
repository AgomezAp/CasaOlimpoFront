import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearDescuentoComponent } from './crear-descuento.component';

describe('CrearDescuentoComponent', () => {
  let component: CrearDescuentoComponent;
  let fixture: ComponentFixture<CrearDescuentoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearDescuentoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearDescuentoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
