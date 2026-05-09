import React, { useCallback, useRef, useState } from 'react';

type KeyControl = {
  label: string;
  key: string;
  keyCode: number;
  code: string;
  wide?: boolean;
};

const controlRows: KeyControl[][] = [
  [
    { label: 'Esc', key: 'Escape', keyCode: 27, code: 'Escape' },
    { label: 'Enter', key: 'Enter', keyCode: 13, code: 'Enter' },
  ],
  [
    { label: '↑', key: 'ArrowUp', keyCode: 38, code: 'ArrowUp' },
    { label: 'W', key: 'w', keyCode: 87, code: 'KeyW' },
    { label: 'Space', key: ' ', keyCode: 32, code: 'Space', wide: true },
  ],
  [
    { label: '←', key: 'ArrowLeft', keyCode: 37, code: 'ArrowLeft' },
    { label: '↓', key: 'ArrowDown', keyCode: 40, code: 'ArrowDown' },
    { label: '→', key: 'ArrowRight', keyCode: 39, code: 'ArrowRight' },
  ],
  [
    { label: 'A', key: 'a', keyCode: 65, code: 'KeyA' },
    { label: 'S', key: 's', keyCode: 83, code: 'KeyS' },
    { label: 'D', key: 'd', keyCode: 68, code: 'KeyD' },
    { label: 'Shift', key: 'Shift', keyCode: 16, code: 'ShiftLeft' },
  ],
];

function App() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());

  const buildKeyboardEvent = useCallback((type: 'keydown' | 'keyup', control: KeyControl) => {
    return new KeyboardEvent(type, {
      key: control.key,
      code: control.code,
      keyCode: control.keyCode,
      which: control.keyCode,
      bubbles: true,
      cancelable: true,
    });
  }, []);

  const fireKey = useCallback(
    (type: 'keydown' | 'keyup', control: KeyControl) => {
      window.dispatchEvent(buildKeyboardEvent(type, control));
      document.dispatchEvent(buildKeyboardEvent(type, control));
      const frameWindow = iframeRef.current?.contentWindow;
      frameWindow?.focus();
    },
    [buildKeyboardEvent],
  );

  const press = useCallback(
    (control: KeyControl) => {
      setActiveKeys((prev) => new Set(prev).add(control.code));
      fireKey('keydown', control);
    },
    [fireKey],
  );

  const release = useCallback(
    (control: KeyControl) => {
      setActiveKeys((prev) => {
        const next = new Set(prev);
        next.delete(control.code);
        return next;
      });
      fireKey('keyup', control);
    },
    [fireKey],
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="px-4 py-3 bg-slate-900 border-b border-slate-800">
        <h1 className="text-lg font-semibold">NimbusFlight Touch Wrapper</h1>
        <p className="text-sm text-slate-300">Tap and hold buttons to emulate keyboard controls.</p>
      </header>

      <main className="flex-1 grid grid-rows-[1fr_auto]">
        <iframe
          ref={iframeRef}
          title="NimbusFlight"
          src="https://nimbusflight.vercel.app/"
          className="w-full h-full border-0 bg-black"
          allow="fullscreen"
        />

        <section className="p-4 bg-slate-900 border-t border-slate-800">
          <div className="grid gap-2 max-w-2xl mx-auto">
            {controlRows.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-2 justify-center">
                {row.map((control) => {
                  const isActive = activeKeys.has(control.code);
                  return (
                    <button
                      key={control.code}
                      type="button"
                      className={`select-none rounded-xl border px-4 py-3 font-semibold transition ${
                        control.wide ? 'min-w-28' : 'min-w-16'
                      } ${
                        isActive
                          ? 'bg-cyan-500 border-cyan-300 text-slate-950'
                          : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                      }`}
                      onMouseDown={() => press(control)}
                      onMouseUp={() => release(control)}
                      onMouseLeave={() => release(control)}
                      onTouchStart={(event) => {
                        event.preventDefault();
                        press(control);
                      }}
                      onTouchEnd={(event) => {
                        event.preventDefault();
                        release(control);
                      }}
                    >
                      {control.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="px-4 py-2 text-xs text-slate-400 bg-slate-900 border-t border-slate-800">
        Tip: tap inside the game once after load so it can capture input.
      </footer>
    </div>
  );
}

export default App;
