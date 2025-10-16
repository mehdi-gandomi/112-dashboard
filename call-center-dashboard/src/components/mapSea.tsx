import React from "react";
import sea from "../data/sea.json";

function MapSea() {
  return (
    <>
      <g className="sea">
        {sea.map((item, index) => (
          <path key={index} d={item.d} />
        ))}
        <text
          x="310"
          y="90"
          fill="#ffffff"
          textAnchor="middle"
          stroke="none"
          fontSize="10px"
          data-id="aus.ost28"
          id="aus.ost28"
        >
          <tspan dy="3.2000049155343504">دریای خزر</tspan>
        </text>
        <text
          x="550"
          y="260"
          fill="#ffffff"
          transform="rotate(45 140,150)"
          fontSize="20px"
          data-id="aus.ost29"
          id="aus.ost29"
        >
          خلیج همیشگی فارس
        </text>
        <text
          x="530"
          y="535"
          textAnchor="middle"
          stroke="none"
          fill="#ffffff"
          fontSize="10px"
          data-id="aus.ost6"
          id="aus.ost6"
        >
          <tspan dy="3.1999817848204657">دریای عمان</tspan>
        </text>
      </g>
    </>
  );
}

export default MapSea;
