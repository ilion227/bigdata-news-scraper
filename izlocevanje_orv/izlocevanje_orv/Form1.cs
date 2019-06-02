using Emgu.CV;
using Emgu.CV.Structure;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace izlocevanje_orv
{
    
    public partial class Form1 : Form
    {
        Image<Gray, float> original;
        Image<Gray, float> slika;

        int resizeWidth = 128;
        int resizeHeight = 256;
        public int steviloKosev = 32;

        int cellSize = 8;
        int blockSize = 4;

        public Form1()
        {
            InitializeComponent();
        }

        private void Form1_Load(object sender, EventArgs e)
        {

        }

        private void LBP()
        {
            Image<Gray, float> kopija = slika.Copy();

            for (var i = 1; i < slika.Rows-1; i++)
            {
                for (var j = 1; j < slika.Cols-1; j++)
                {
                    float[] values = new float[8];

                    try
                    {

                    

                   values[0] = slika.Data[i - 1, j - 1, 0];
                    values[1] = slika.Data[i - 1, j, 0];
                    values[2] = slika.Data[i - 1, j + 1, 0];
                   values[3] = slika.Data[i, j + 1, 0];
                    values[4] = slika.Data[i+1, j + 1, 0];
                    values[5] = slika.Data[i+ 1, j, 0];
                    values[6] = slika.Data[i + 1, j - 1, 0];
                    values[7] = slika.Data[i, j - 1, 0];

                    String binarno = "";

                    foreach(float value in values){
                        if(value >= slika.Data[i, j, 0])
                        {
                            binarno += "1";
                        } else
                        {
                            binarno += "0";
                        }
                    }

                    int novaVrednost = Convert.ToInt32(binarno, 2);



                    kopija.Data[i, j, 0] = novaVrednost;
                    }
                    catch (Exception)
                    {
                    }

                }
            }
            editedImage.Image = kopija;
        }
        
        private void HOG()
        {
            Image<Gray, float> kopija = slika.Copy();
            editedImage.Image = kopija;

            Image<Gray, float> gRobovi = new Image<Gray, float>(slika.Width, slika.Height);
            Image<Gray, float> aSmeri = new Image<Gray, float>(slika.Width, slika.Height);

            Image<Gray, float> roboviX = slika.Sobel(1, 0, 3);
            Image<Gray, float> roboviY = slika.Sobel(0, 1, 3);

            for (int i = 0; i < gRobovi.Height; i++)
            {
                for (int j = 0; j < gRobovi.Width; j++)
                {
                    float x = roboviX.Data[i, j, 0];
                    float y = roboviY.Data[i, j, 0];
                    gRobovi.Data[i, j, 0] = (float)Math.Sqrt(Math.Pow(x, 2) + Math.Pow(y, 2));
                    aSmeri.Data[i, j, 0] = (float)Math.Atan2(y, x);
                }
            }

            List<float> normaliziran_histogram = new List<float>();

            for (var i = 0; i < slika.Rows; i+=(this.cellSize * this.blockSize)/2)
            {
                for (var j = 0; j < slika.Cols; j+=(this.cellSize * this.blockSize)/2)
                {
                    // Bloki

                    List<float[]> histogram_blok = new List<float[]>();
                    
                    for(var k = i; k < i + this.cellSize * this.blockSize; k += this.cellSize)
                    {
                        for(var l = j; l < j + this.cellSize * this.blockSize; l+=this.cellSize)
                        {
                            float[] histogram = new float[this.steviloKosev];
                            // Celice
                            for (var x = k; x < k + this.cellSize; x++)
                            {
                                for (var y = l; y < l + this.cellSize; y++)
                                {
                                    if (x >= slika.Rows || y >= slika.Cols)
                                    {
                                        continue;
                                    }
                                    float velikost = 180 / this.steviloKosev;
                                        float kot = aSmeri.Data[x, y, 0] * (float)(180 / Math.PI);
                                        while (kot < 0) kot += 180;

                                        float moc = gRobovi.Data[x, y, 0];
                                        int indeks = (int)(kot / velikost);
                                        if (indeks >= this.steviloKosev)
                                        {
                                            indeks = indeks - this.steviloKosev;
                                        }

                                        histogram[indeks] += moc;

                                        //Pixli
                                        //Console.WriteLine("Blok[{0},{1}], Celica[{2},{3}], Pixel[{4},{5}]", i, j, k, l, x, y);
                                }
                            }
                            histogram_blok.Add(histogram);
                        }
                    }

                    float vsota = 0;
                    for (int m = 0; m < histogram_blok.Count; m++)
                    {
                        float[] hist = histogram_blok.ElementAt(m);
                        for (int n = 0; n < this.steviloKosev; n++)
                        {
                            vsota += hist[n];
                        }
                    }

                    if(vsota == 0)
                    {
                        vsota = 0.000001f;
                    }

                    for (int m = 0; m < histogram_blok.Count; m++)
                    {
                        float[] hist = histogram_blok.ElementAt(m);
                        for (int n = 0; n < this.steviloKosev; n++)
                        {
                            normaliziran_histogram.Add(hist[n] / vsota);
                        }
                    }
                }
            }

            editedImage.Image = kopija;

            TextWriter tw = new StreamWriter("hog.txt");

            foreach (float vrednost in normaliziran_histogram)
                tw.WriteLine(vrednost);

            tw.Close();

        }

        private void load_image_Click(object sender, EventArgs e)
        {
            OpenFileDialog dialog = new OpenFileDialog();
            if (dialog.ShowDialog() == DialogResult.OK)
            {
                original = new Image<Gray, float>(dialog.FileName);
                orgImage.Image = original;

                slika = original.Resize(this.resizeWidth, this.resizeHeight, Emgu.CV.CvEnum.Inter.Linear);

                orgImage.Image = original;


                HOG();
                LBP();

            }
        }
    }
}
