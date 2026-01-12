import {
  approve,
  markPaid,
  reject,
  Ticket,
  TicketTransitionError,
} from './tickets';

function expectThrow(fn: () => void) {
  let threw = false;
  try {
    fn();
  } catch (e) {
    threw = true;
    if (!(e instanceof TicketTransitionError)) {
      throw new Error('Threw the wrong error type');
    }
  }
  if (!threw) throw new Error('Expected an error, but none was thrown');
}

const t0: Ticket = { id: 't', status: 'pending' };

const t1 = approve(t0);
const t2 = markPaid(t1);

expectThrow(() => markPaid(t0)); // pending -> paid illegal
expectThrow(() => approve(t2)); // paid -> approved illegal
expectThrow(() => reject(t2)); // paid -> rejected illegal

console.log('tickets state machine devcheck ok');
