import { useEffect, useRef, useState } from "react";

function normalize(value: number, min: number, max: number) {
  return (value - min) / (max - min);
}

interface MousePosition {
  x: number | null;
  y: number | null;
}

function useMousePosition() {
  const [mouseDown, setMouseDown] = useState(false);
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: null, y: null });

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (mouseDown) {
      setMousePosition({ x: e.pageX, y: e.pageY });
    }
  }
  return { mouseDown, setMouseDown, mousePosition, onMouseMove };
}

interface HSLColor {
  h: number;
  s: number;
  l: number;
}

function ColorSelector(props: { onChange?: (hsl: HSLColor) => void }) {
  const { mouseDown, setMouseDown, mousePosition, onMouseMove } = useMousePosition();
  const circle = useRef<HTMLDivElement>(null);

  const selector = useRef<HTMLDivElement>(null);
  const [color, setColor] = useState<HSLColor>({ h: 30, s: 0, l: 0 });
  const [value, setValue] = useState(0.7);
  const [backgroundColor, setBackgroundColor] = useState("hsl(30, 0%, 0%)");

  useEffect(() => {
    const circleRect = circle.current!.getBoundingClientRect();
    const selectorRect = selector.current!.getBoundingClientRect();

    const circleWidth = circleRect.width / 2;
    const circleHeight = circleRect.height / 2;

    const xLowSel = selectorRect.left;
    const xHighSel = selectorRect.right;
    const yLowSel = selectorRect.top;
    const yHighSel = selectorRect.bottom;

    const innerLowX = xLowSel + circleWidth;
    const innerHighX = xHighSel - circleWidth;
    const innerLowY = yLowSel + circleHeight;
    const innerHighY = yHighSel - circleHeight;

    const h = normalize(mousePosition.x!, innerLowX, innerHighX) * 360;
    const l = normalize(mousePosition.y!, innerHighY, innerLowY) * 100;
    const s = value * 100;

    setColor({ h, s, l });

    if (mousePosition.x! >= innerLowX && mousePosition.x! <= innerHighX) {
      circle.current!.style.position = "relative";
      circle.current!.style.left = `${mousePosition.x! - circleWidth - xLowSel}px`;
    }
    if (mousePosition.y! >= innerLowY && mousePosition.y! <= innerHighY) {
      circle.current!.style.position = "relative";
      circle.current!.style.top = `${mousePosition.y! - circleHeight - yLowSel}px`;
    }

    setBackgroundColor(`hsl(${h}, ${s}%, ${l}%)`);
  }, [mousePosition, value]);

  useEffect(() => {
    props.onChange && props.onChange(color);
  }, [color]);

  return (
    <>
      <div className="color-selector-container">
        <div
          ref={selector}
          style={{ background: backgroundColor }}
          className="color-selector"
          onMouseDown={() => setMouseDown(true)}
          onMouseMove={onMouseMove}
          onMouseUp={() => setMouseDown(false)}
        >
          <div ref={circle} className="circle"></div>
        </div>
        <Slider onChange={(val) => setValue(val)}></Slider>
      </div>
      {/* <p>
        {mouseDown ? "Mouse is down" : "Mouse is up"}
        {mousePosition.x && mousePosition.y ? ` at ${mousePosition.x}, ${mousePosition.y}` : ""}
      </p> */}
    </>
  );
}

function Slider(props: { onChange?: (value: number) => void }) {
  const slider = useRef<HTMLDivElement>(null);
  const sliderContainer = useRef<HTMLDivElement>(null);
  const { mouseDown, setMouseDown, mousePosition, onMouseMove } = useMousePosition();

  useEffect(() => {
    const sliderContainerRect = sliderContainer.current!.getBoundingClientRect();
    if (mouseDown) {
      if (mousePosition.x! >= sliderContainerRect.left && mousePosition.x! <= sliderContainerRect.right) {
        const sliderHeight = sliderContainerRect.height - mousePosition.y! + sliderContainerRect.y;
        slider.current!.style.height = `${sliderHeight}px`;
        props.onChange && props.onChange(normalize(sliderHeight, 0, sliderContainerRect.height));
      }
    }
  }, [mousePosition]);

  return (
    <div ref={sliderContainer} onMouseMove={onMouseMove} className="slider-container">
      <div
        ref={slider}
        onMouseDown={() => setMouseDown(true)}
        onMouseUp={() => setMouseDown(false)}
        className="slider"
      ></div>
    </div>
  );
}

function Knob(props: { onChange?: (value: number) => void }) {
  const knob = useRef<HTMLDivElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const base = useRef<HTMLDivElement>(null);

  const { mouseDown, setMouseDown, mousePosition, onMouseMove } = useMousePosition();

  useEffect(() => {
    const rect = knob.current?.getBoundingClientRect();
    const cRect = container.current?.getBoundingClientRect();
    const baseRect = base.current?.getBoundingClientRect();

    if (rect && cRect && baseRect) {
      const pos =
        normalize(mousePosition.x ? mousePosition.x : baseRect.left, baseRect.left, baseRect.right) * 2 * Math.PI;
      console.log(pos);

      knob.current!.style.left = `${Math.cos(pos) * 50 + cRect.width / 2 - rect.width / 2}px`;
      knob.current!.style.top = `${Math.sin(pos) * 50 + cRect.height / 2 - rect.height / 2}px`;

      props.onChange && props.onChange(normalize(pos, 0, 2 * Math.PI));
    }
  }, [mousePosition]);

  return (
    <div ref={container} onMouseMove={onMouseMove} className="knob-container">
      <div
        ref={base}
        onMouseDown={() => setMouseDown(true)}
        onMouseUp={() => setMouseDown(false)}
        className="knob-base"
      ></div>
      <div ref={knob} className="knob"></div>
    </div>
  );
}

function App() {
  const [color, setColor] = useState<HSLColor>({ h: 0, s: 0, l: 0 });
  const [color2, setColor2] = useState<HSLColor>({ h: 0, s: 0, l: 0 });
  const [copied, setCopied] = useState(false);

  function onCopy(e: React.MouseEvent<HTMLButtonElement>) {
    navigator.clipboard.writeText(
      `linear-gradient(90deg, hsl(${color.h}, ${color.s}%, ${color.l}%), hsl(${color2.h}, ${color2.s}%, ${color2.l}%))`
    );
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1000);
  }

  const [deg, setDeg] = useState(0);

  return (
    <>
      <h1 style={{ textAlign: "center" }}>Gradient Generator</h1>
      <div className="App">
        <Knob onChange={setDeg}></Knob>
        <ColorSelector onChange={setColor}></ColorSelector>
        <ColorSelector onChange={setColor2}></ColorSelector>
        <div
          className="color-preview"
          style={{
            background: `linear-gradient(${Math.abs(deg * 360)}deg, hsl(${color.h}, ${color.s}%, ${color.l}%), hsl(${
              color2.h
            }, ${color2.s}%, ${color2.l}%))`,
          }}
        >
          <button className="copy-btn" onClick={onCopy}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 7H7V5H13V7Z" fill="currentColor" />
              <path d="M13 11H7V9H13V11Z" fill="currentColor" />
              <path d="M7 15H13V13H7V15Z" fill="currentColor" />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M3 19V1H17V5H21V23H7V19H3ZM15 17V3H5V17H15ZM17 7V19H9V21H19V7H17Z"
                fill="currentColor"
              />
            </svg>
            <span>{copied ? "Copied!" : null}</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default App;
