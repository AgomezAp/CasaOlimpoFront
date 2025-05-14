import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacturaIdComponent } from './factura-id.component';

describe('FacturaIdComponent', () => {
  let component: FacturaIdComponent;
  let fixture: ComponentFixture<FacturaIdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacturaIdComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacturaIdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
