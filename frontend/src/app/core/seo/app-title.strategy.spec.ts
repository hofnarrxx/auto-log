import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, of } from 'rxjs';
import { AppTitleStrategy } from './app-title.strategy';

describe('AppTitleStrategy', () => {
  let strategy: AppTitleStrategy;
  let title: jasmine.SpyObj<Title>;
  let stream: jasmine.Spy;

  const snapshot = {} as RouterStateSnapshot;

  beforeEach(() => {
    title = jasmine.createSpyObj('Title', ['setTitle']);
    stream = jasmine.createSpy('stream').and.callFake((key: string) => of(`T(${key})`));

    TestBed.configureTestingModule({
      providers: [
        AppTitleStrategy,
        { provide: Title, useValue: title },
        { provide: TranslateService, useValue: { stream } },
      ],
    });
    strategy = TestBed.inject(AppTitleStrategy);
  });

  it('translates the route title key and appends the site name', () => {
    spyOn(strategy, 'buildTitle').and.returnValue('titles.login');

    strategy.updateTitle(snapshot);

    expect(stream).toHaveBeenCalledWith('titles.login');
    expect(title.setTitle).toHaveBeenCalledWith('T(titles.login) | AutoLog');
  });

  it('uses the full default title when the route has no title', () => {
    spyOn(strategy, 'buildTitle').and.returnValue(undefined);

    strategy.updateTitle(snapshot);

    expect(stream).toHaveBeenCalledWith('seo.defaultTitle');
    expect(title.setTitle).toHaveBeenCalledWith('T(seo.defaultTitle)');
  });

  it('does not show the raw key while translations are still loading', () => {
    spyOn(strategy, 'buildTitle').and.returnValue('titles.login');
    stream.and.returnValue(of('titles.login'));

    strategy.updateTitle(snapshot);

    expect(title.setTitle).not.toHaveBeenCalled();
  });

  it('updates the title when the language changes', () => {
    spyOn(strategy, 'buildTitle').and.returnValue('titles.login');
    const text$ = new BehaviorSubject('Log in');
    stream.and.returnValue(text$);

    strategy.updateTitle(snapshot);
    text$.next('Logowanie');

    expect(title.setTitle).toHaveBeenCalledWith('Log in | AutoLog');
    expect(title.setTitle).toHaveBeenCalledWith('Logowanie | AutoLog');
  });
});
