import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { AttachmentPicker } from './attachment-picker';

describe('AttachmentPicker', () => {
  let fixture: ComponentFixture<AttachmentPicker>;
  let component: AttachmentPicker;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AttachmentPicker, TranslateModule.forRoot()],
    });
    fixture = TestBed.createComponent(AttachmentPicker);
    component = fixture.componentInstance;
  });

  function file(name: string): File {
    return new File(['content'], name, { type: 'image/png' });
  }

  it('emits filesSelected when files are chosen', () => {
    fixture.detectChanges();
    const emitted: FileList[] = [];
    component.filesSelected.subscribe((files) => emitted.push(files));

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="file"]');
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file('receipt.png'));
    Object.defineProperty(input, 'files', { value: dataTransfer.files });
    input.dispatchEvent(new Event('change'));

    expect(emitted.length).toBe(1);
    expect(emitted[0].length).toBe(1);
  });

  it('emits pendingRemoved with the clicked index', () => {
    component.pendingFiles = [file('a.png'), file('b.png')];
    fixture.detectChanges();

    const emitted: number[] = [];
    component.pendingRemoved.subscribe((index) => emitted.push(index));

    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll(
      '.attachments-list.pending button'
    );
    buttons[1].click();

    expect(emitted).toEqual([1]);
  });
});
