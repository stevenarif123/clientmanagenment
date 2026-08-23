/**
 * Utility Functions for Client Management System
 */

window.Utils = {
  /**
   * Format number as Indonesian Rupiah (IDR)
   */
  formatCurrency(value) {
    if (value === null || value === undefined || isNaN(value)) return 'Rp 0';
    return 'Rp ' + Number(value).toLocaleString('id-ID');
  },

  /**
   * Format Date to Indonesian/Readable standard (e.g. 21 Aug 2026)
   */
  formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  },

  /**
   * Format Date & Time
   */
  formatDateTime(dateStr) {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  },

  /**
   * Get avatar initials from name
   */
  getInitials(name) {
    if (!name) return 'A';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  },

  /**
   * Format file size in bytes to human readable format (KB, MB)
   */
  formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },

  /**
   * Format phone number to WhatsApp international link
   */
  getWhatsAppUrl(phone, message = '') {
    if (!phone) return '#';
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    const textParam = message ? `?text=${encodeURIComponent(message)}` : '';
    return `https://wa.me/${clean}${textParam}`;
  },

  /**
   * Format mailto URL
   */
  getMailtoUrl(email, subject = '') {
    if (!email) return '#';
    const subjectParam = subject ? `?subject=${encodeURIComponent(subject)}` : '';
    return `mailto:${email}${subjectParam}`;
  },


  /**
   * Project status badge styling
   */
  getStatusBadgeClass(status) {
    switch (status) {
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'On Hold':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Pending':
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  },

  /**
   * Payment status badge styling
   */
  getPaymentStatusBadgeClass(status) {
    switch (status) {
      case 'Received':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Refunded':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  },

  /**
   * Submission status badge styling
   */
  getSubmissionStatusBadgeClass(status) {
    switch (status) {
      case 'New':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Reviewed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Converted':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Spam':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  },

  /**
   * Global Toast Notification System
   */
  toast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const el = document.createElement('div');
    const bgColors = {
      success: 'bg-slate-900 text-white border-slate-800',
      error: 'bg-rose-600 text-white border-rose-700',
      info: 'bg-slate-800 text-white border-slate-700',
      warning: 'bg-amber-600 text-white border-amber-700'
    };

    el.className = `flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all duration-300 transform translate-y-2 opacity-0 ${bgColors[type] || bgColors.info}`;
    el.innerHTML = `<span>${message}</span>`;

    toastContainer.appendChild(el);

    // Animate in
    setTimeout(() => {
      el.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    // Animate out & remove
    setTimeout(() => {
      el.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => el.remove(), 300);
    }, 3500);
  }
};
