namespace izlocevanje_orv
{
    partial class Form1
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.components = new System.ComponentModel.Container();
            this.load_image = new System.Windows.Forms.Button();
            this.orgImage = new Emgu.CV.UI.ImageBox();
            this.editedImage = new Emgu.CV.UI.ImageBox();
            ((System.ComponentModel.ISupportInitialize)(this.orgImage)).BeginInit();
            ((System.ComponentModel.ISupportInitialize)(this.editedImage)).BeginInit();
            this.SuspendLayout();
            // 
            // load_image
            // 
            this.load_image.Location = new System.Drawing.Point(55, 27);
            this.load_image.Name = "load_image";
            this.load_image.Size = new System.Drawing.Size(75, 23);
            this.load_image.TabIndex = 0;
            this.load_image.Text = "Nalozi";
            this.load_image.UseVisualStyleBackColor = true;
            this.load_image.Click += new System.EventHandler(this.load_image_Click);
            // 
            // orgImage
            // 
            this.orgImage.FunctionalMode = Emgu.CV.UI.ImageBox.FunctionalModeOption.Minimum;
            this.orgImage.Location = new System.Drawing.Point(12, 66);
            this.orgImage.Name = "orgImage";
            this.orgImage.Size = new System.Drawing.Size(401, 552);
            this.orgImage.TabIndex = 2;
            this.orgImage.TabStop = false;
            // 
            // editedImage
            // 
            this.editedImage.FunctionalMode = Emgu.CV.UI.ImageBox.FunctionalModeOption.Minimum;
            this.editedImage.Location = new System.Drawing.Point(419, 66);
            this.editedImage.Name = "editedImage";
            this.editedImage.Size = new System.Drawing.Size(369, 552);
            this.editedImage.TabIndex = 3;
            this.editedImage.TabStop = false;
            // 
            // Form1
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(800, 630);
            this.Controls.Add(this.editedImage);
            this.Controls.Add(this.orgImage);
            this.Controls.Add(this.load_image);
            this.Name = "Form1";
            this.Text = "Form1";
            this.Load += new System.EventHandler(this.Form1_Load);
            ((System.ComponentModel.ISupportInitialize)(this.orgImage)).EndInit();
            ((System.ComponentModel.ISupportInitialize)(this.editedImage)).EndInit();
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.Button load_image;
        private Emgu.CV.UI.ImageBox orgImage;
        private Emgu.CV.UI.ImageBox editedImage;
    }
}

