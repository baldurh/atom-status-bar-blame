/** @babel */

import moment from 'moment';
import * as utils from '../lib/utils';
import BlameView from '../lib/blame-status-bar-view';

describe('Status Bar Blame', () => {
  let workspaceElement;
  const blameEl = () => workspaceElement.querySelector('status-bar-blame');

  beforeEach(() => {
    workspaceElement = atom.views.getView(atom.workspace);
    waitsForPromise(() => atom.packages.activatePackage('status-bar'));
    waitsForPromise(() => atom.packages.activatePackage('status-bar-blame'));
  });

  describe('Status bar', () => {
    let renderSpy;
    beforeEach(() => {
      renderSpy = spyOn(BlameView.prototype, 'render').andCallThrough();
    });

    it('should render blame element', () => {
      spyOn(utils, 'findRepo').andReturn(null);
      waitsForPromise(() => atom.workspace.open('empty.txt'));
      waitsFor(() => renderSpy.callCount > 0);
      runs(() => {
        expect(blameEl()).toExist();
      });
    });

    it('should render "Not Committed Yet" when there’s no data for file', () => {
      spyOn(utils, 'findRepo').andReturn('.git');
      spyOn(utils, 'blameFile').andReturn(null);
      waitsForPromise(() => atom.workspace.open('empty.txt'));
      waitsFor(() => renderSpy.callCount > 0);
      runs(() => {
        expect(blameEl().innerHTML).toEqual('Not Committed Yet');
      });
    });

    it('should not render when there’s no git repo', () => {
      spyOn(utils, 'findRepo').andReturn(null);
      waitsForPromise(() => atom.workspace.open('empty.txt'));
      waitsFor(() => renderSpy.callCount > 0);
      runs(() => {
        expect(blameEl().innerHTML).toEqual('');
      });
    });

    it('should render "Not committed yet" when the line hasn’t been committed', () => {
      spyOn(utils, 'findRepo').andReturn('.git');
      spyOn(utils, 'blameFile').andReturn([{
        author: 'Not Committed Yet',
        date: '2017-04-03 17:05:39 +0000',
        line: '1',
        rev: '00000000',
      }]);
      waitsForPromise(() => atom.workspace.open('empty.txt'));
      waitsFor(() => renderSpy.callCount > 0);
      runs(() => {
        expect(blameEl().innerHTML).toEqual('Not Committed Yet');
      });
    });

    it('should render author name and date', () => {
      spyOn(utils, 'findRepo').andReturn('.git');
      spyOn(utils, 'blameFile').andReturn([{
        author: 'Baldur Helgason',
        date: '2016-04-04 09:05:39 +0000',
        line: '1',
        rev: '12345678',
      }]);

      spyOn(BlameView.prototype, 'getTooltipContent').andReturn();
      waitsForPromise(() => atom.workspace.open('empty.txt'));
      waitsFor(() => renderSpy.callCount > 0);
      runs(() => {
        expect(blameEl().innerHTML).toEqual('<a href="#"><span class="author">Baldur Helgason</span> · <span class="date">2016-04-04</span></a>');
      });
    });

    it('should render author name and relative date (2 days ago)', () => {
      spyOn(utils, 'findRepo').andReturn('.git');
      spyOn(utils, 'blameFile').andReturn([{
        author: 'Baldur Helgason',
        date: moment().subtract(2, 'days').format('YYYY-MM-DD HH:mm:ss'),
        line: '1',
        rev: '12345678',
      }]);

      spyOn(BlameView.prototype, 'getTooltipContent');
      waitsForPromise(() => atom.workspace.open('empty.txt'));
      waitsFor(() => renderSpy.callCount > 0);
      runs(() => {
        expect(blameEl().innerHTML).toEqual('<a href="#"><span class="author">Baldur Helgason</span> · <span class="date">2 days ago</span></a>');
      });
    });

    it('should copy the commit hash on shift+click', () => {
      let spy = null;
      spyOn(utils, 'findRepo').andReturn('.git');
      spyOn(utils, 'blameFile').andReturn([{
        author: 'Baldur Helgason',
        date: '2017-04-03 17:05:39 +0000',
        line: '1',
        rev: '12345678',
      }]);

      spyOn(atom.clipboard, 'write');
      spyOn(BlameView.prototype, 'getTooltipContent');

      waitsForPromise(() => atom.workspace.open('empty.txt'));

      waitsFor(() => renderSpy.callCount > 0);

      runs(() => {
        spy = spyOn(BlameView.prototype, 'copyCommitHash').andCallThrough();

        const event = new Event('click');
        event.shiftKey = true;
        blameEl().dispatchEvent(event);
      });

      waitsFor(() => spy.callCount > 0);

      runs(() => {
        expect(atom.clipboard.write).toHaveBeenCalledWith('12345678');
      });
    });

    it('should display notification tooltip when url is unknown', () => {
      let spy = null;
      spyOn(utils, 'findRepo').andReturn('.git');
      spyOn(utils, 'blameFile').andReturn([{
        author: 'Baldur Helgason',
        date: '2017-04-03 17:05:39 +0000',
        line: '1',
        rev: '12345678',
      }]);

      spyOn(utils, 'getCommitLink').andReturn(null);

      spyOn(BlameView.prototype, 'getTooltipContent');

      waitsForPromise(() => atom.workspace.open('empty.txt'));

      waitsFor(() => renderSpy.callCount > 0);

      runs(() => {
        spy = spyOn(BlameView.prototype, 'addNotificationTooltip').andCallThrough();

        const event = new Event('click');
        blameEl().dispatchEvent(event);
      });

      waitsFor(() => spy.callCount > 0);

      runs(() => {
        expect(spy).toHaveBeenCalledWith('Unknown url. Shift-click to copy hash.', 2000);
      });
    });
  });
});
