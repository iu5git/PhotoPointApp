import { FileInput, TextInput, MantineProvider, rem, Button, Table, Input, createTheme } from '@mantine/core';
import { IconFileInfo } from '@tabler/icons-react';
import './App.scss';
import { useState, useEffect } from 'react';
import { Stage, Layer, Image, Circle, Text } from 'react-konva';
import useImage from 'use-image';

interface Measurement {
  start: string,
  end: string,
  distance: string,
  note: string
}

const theme = createTheme({
  colors: {
    'blue': [
      '#ebfbee',
      '#daf4df',
      '#b4e7be',
      '#8cdb9a',
      '#6ad07b',
      '#54c969',
      '#48c65e',
      '#38af4d',
      '#2e9b43',
      '#1f8736'
    ],
  }
});

const App = () => {
  const icon = <IconFileInfo style={{ width: rem(18), height: rem(18) }} stroke={1.5} />;
  const [photo, setPhoto] = useState<File | null>(null);
  const [imageURL, setImageURL] = useState<string | null>(null);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [distance, setDistance] = useState<number | null>(null);
  const [image] = useImage(!!imageURL ? imageURL : '');
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [photoScale, setPhotoScale] = useState('20');
  const [units, setUnits] = useState('нм');
  const [savedMeasurements, setMeasurements] = useState<Measurement[]>([]);

  const scale = Math.min(window.innerWidth / 2 / imageDimensions.width, window.innerHeight / imageDimensions.height);

  useEffect(() => {
    if (photo) {
      const url = URL.createObjectURL(photo);
      setImageURL(url);

      const img = new window.Image();
      img.src = url;
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
      };
    }
  }, [photo]);

  useEffect(() => {
    if (points.length === 2) {
      const [p1, p2] = points;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      setDistance(Math.sqrt(dx * dx + dy * dy));
    } else {
      setDistance(null);
    }
  }, [points]);

  const handleStageClick = (e: any) => {
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    if (point) {
      setPoints((prevPoints) => {
        if (prevPoints.length === 2) {
          setDistance(null);
          return [point];
        }
        return [...prevPoints, point];
      });
    }
  };

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoScale(e.target.value);
  };

  const handleUnitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUnits(e.target.value);
  };

  const addMeasurement = () => {
    if (points.length === 2 && distance !== null) {
      const measurement = {
        start: `${(Number(photoScale) * points[0].x / (imageDimensions.width * scale)).toFixed(1)}, ${(Number(photoScale) * points[0].y / (imageDimensions.width * scale)).toFixed(1)}`,
        end: `${(Number(photoScale) * points[1].x / (imageDimensions.width * scale)).toFixed(1)}, ${(Number(photoScale) * points[1].y / (imageDimensions.width * scale)).toFixed(1)}`,
        distance: `${(Number(photoScale) * distance / (imageDimensions.width * scale)).toFixed(2)} ${units}`,
        note: '',
      };
      setMeasurements((state) => [...state, measurement]);
    }
  };

  const handleNoteChange = (index: number, note: string) => {
    setMeasurements((state) => {
      const updatedMeasurements = [...state];
      updatedMeasurements[index].note = note;
      return updatedMeasurements;
    });
  };

  const generateCSV = (data: any) => {
    const csvRows = [];
    const headers = ['Начальная точка (x, y)', 'Конечная точка (x, y)', `Расстояние в ${units}`, 'Примечание'];
    csvRows.push(headers.join(','));

    data.forEach((element: any) => {
      const row = [
        `${element.start}`,
        `${element.end}`,
        `${element.distance}`,
        `${element.note}`
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  };

  const downloadCSV = (csvContent: any, fileName = 'measurements.csv') => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownload = () => {
    const csvContent = generateCSV(savedMeasurements.reverse());
    downloadCSV(csvContent);
  };

  return (
    <MantineProvider theme={theme}>
      <div className='app'>
        {imageURL && (
          <div className='app-r-pannel'>
            <Stage width={window.innerWidth / 2} height={window.innerHeight} onClick={handleStageClick}>
              <Layer>
                <Image
                  image={image}
                  width={imageDimensions.width * scale}
                  height={imageDimensions.height * scale}
                  x={(window.innerWidth / 2 - imageDimensions.width * scale) / 2}
                  y={(window.innerHeight - imageDimensions.height * scale) / 2}
                />
                {points.map((point, index) => (
                  <Circle key={index} x={point.x} y={point.y} radius={4} fill='red' />
                ))}
                {distance !== null && (
                  <Text
                    x={(points[0].x + points[1].x) / 2}
                    y={(points[0].y + points[1].y) / 2}
                    text={(Number(photoScale) * distance / (imageDimensions.width * scale)).toFixed(2)}
                    fontSize={15}
                    fill='black'
                  />
                )}
              </Layer>
            </Stage>
          </div>
        )}
        <div className='app-l-pannel'>
          <FileInput
            leftSection={icon}
            label='Загрузите изображение'
            placeholder='Изображение'
            leftSectionPointerEvents='none'
            value={photo}
            onChange={setPhoto}
          />
          <div className='app-l-pannel-scale'>
            <TextInput
              label="Ширина изображения"
              placeholder='20'
              value={photoScale}
              onChange={handleScaleChange}
            />
            <TextInput
              label="Единицы измерения"
              placeholder='нм'
              value={units}
              onChange={handleUnitsChange}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text>
                Текущее измерение: {!!distance ?
                  (Number(photoScale) * distance / (imageDimensions.width * scale)).toFixed(2) + units
                  : "0.00" + units
                }
              </Text>
              <Button color='green.8' onClick={addMeasurement} disabled={!distance}>Добавить</Button>
            </div>
            <Button onClick={handleDownload} color='green.8' disabled={savedMeasurements.length === 0}>Скачать CSV</Button>
          </div>
          {
            savedMeasurements.length !== 0 &&
            <Table.ScrollContainer minWidth={"auto"}>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Начальная точка (x, y)</Table.Th>
                    <Table.Th>Конечная точка (x, y)</Table.Th>
                    <Table.Th>Расстояние</Table.Th>
                    <Table.Th>Примечание</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {
                    savedMeasurements.map((element, index) => (
                      <Table.Tr key={index}>
                        <Table.Td>{element.start}</Table.Td>
                        <Table.Td>{element.end}</Table.Td>
                        <Table.Td>{element.distance}</Table.Td>
                        <Table.Td>
                          <Input value={element.note} onChange={(e) => handleNoteChange(index, e.target.value)} />
                        </Table.Td>
                      </Table.Tr>
                    ))
                  }
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          }
        </div>
      </div>
    </MantineProvider>
  );
};

export default App;
