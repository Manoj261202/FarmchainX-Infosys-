import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-upload-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './upload-product.html'
})
export class UploadProduct {

  cropName = '';
  soilType = '';
  pesticides = '';
  harvestDate = '';
  gpsLocation = '';
  price: number | null = null;
  quantity: number = 1000;
  quantityUnit: string = 'kg';
  imageFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;

  loading = false;
  today = this.getTodayString();

  showPrediction = false;
  aiPrediction: any = null;
  productId: number | null = null;

  constructor(
    private productService: ProductService,
    private router: Router,
    private http: HttpClient
  ) { }

  private getTodayString(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  onFileSelected(event: any) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    this.imageFile = file;
    const reader = new FileReader();
    reader.onload = () => this.previewUrl = reader.result;
    reader.readAsDataURL(file);
  }

  // ✅ Updated GPS method with Reverse Geocoding
  detectGPS() {
    if (!navigator.geolocation) {
      alert("GPS not supported");
      return;
    }

    this.loading = true;

    navigator.geolocation.getCurrentPosition(position => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;

      this.http.get<any>(url).subscribe({
        next: (data) => {
          this.loading = false;

          if (data && data.display_name) {
            this.gpsLocation = data.display_name;  // ✅ Full address
            alert('Address detected successfully');
          } else {
            this.gpsLocation = `${lat}, ${lng}`;   // fallback
            alert('Could not fetch address, saved coordinates instead');
          }
        },
        error: (err) => {
          this.loading = false;
          console.error('Reverse geocoding error:', err);
          this.gpsLocation = `${lat}, ${lng}`;
          alert('Error fetching address');
        }
      });

    }, (err) => {
      this.loading = false;
      console.warn('GPS error', err);
      alert('Unable to detect GPS');
    });
  }

  
  uploadProduct() {
    if (!this.imageFile) {
      alert("Please select an image");
      return;
    }

    if (this.harvestDate && this.harvestDate > this.today) {
      alert('Harvest date cannot be in the future.');
      return;
    }

    this.loading = true;

    const formData = new FormData();
    formData.append('cropName', this.cropName.trim());
    formData.append('soilType', this.soilType.trim());
    formData.append('pesticides', this.pesticides.trim());
    formData.append('harvestDate', this.harvestDate);
    formData.append('gpsLocation', this.gpsLocation.trim());
    formData.append('price', this.price ? String(this.price) : '0');
    formData.append('quantity', String(this.quantity));
    formData.append('quantityUnit', this.quantityUnit);
    formData.append('image', this.imageFile);

    this.productService.uploadProduct(formData)
      .subscribe({
        next: (res) => {
          this.loading = false;
          if (res.success && res.aiPrediction) {
            this.aiPrediction = res.aiPrediction;
            this.productId = res.id;
            this.showPrediction = true;
          } else {
            alert(`Product uploaded! ID = ${res.id}`);
            this.router.navigate(['/products/my']);
          }
        },
        error: (err) => {
          this.loading = false;
          console.error('Upload error:', err);
          const serverMsg = err?.error?.message || 'Upload failed!';
          alert(`Upload failed: ${serverMsg}`);
        }
      });
  }

  closePredictionModal() {
    this.showPrediction = false;
    this.router.navigate(['/dashboard']);
  }

  getQualityColor(grade: string): string {
    if (!grade) return 'slate';
    const gradeUpper = grade.toUpperCase();
    if (gradeUpper.includes('A+') || gradeUpper === 'A') return 'emerald';
    if (gradeUpper.includes('B+') || gradeUpper === 'B') return 'yellow';
    if (gradeUpper === 'C') return 'orange';
    return 'slate';
  }
}