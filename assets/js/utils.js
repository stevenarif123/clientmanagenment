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
   * Format Date to readable standard (e.g. 21 Agu 2026)
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
   * Check whether a due date is overdue (not completed and before today)
   */
  isOverdue(dueDate, status) {
    if (!dueDate || status === 'Completed') return false;
    const today = new Date().toISOString().slice(0, 10);
    return dueDate.slice(0, 10) < today;
  },

  /**
   * Resolve uploaded asset URLs seamlessly for root or subfolder deployments
   */
  resolveAssetUrl(url) {
    if (!url) return '#';
    if (/^https?:\/\//i.test(url)) return url;
    const baseDir = window.location.pathname.replace(/\/(index|portal|public-contact-form)\.html$/i, '').replace(/\/+$/, '');
    const cleanRel = url.replace(/^\/+/, '');
    if (baseDir && cleanRel.startsWith(baseDir.replace(/^\/+/, '') + '/')) {
      return '/' + cleanRel;
    }
    return `${baseDir}/${cleanRel}`;
  },

  /**
   * Get avatar initials from name
   */
  getInitials(name) {
    if (!name) return 'A';
    const parts = name.trim().split(/\s+/);
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
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'On Hold':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Pending':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  },

  /**
   * Payment status badge styling
   */
  getPaymentStatusBadgeClass(status) {
    switch (status) {
      case 'Received':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Refunded':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  },

  /**
   * Submission status badge styling
   */
  getSubmissionStatusBadgeClass(status) {
    switch (status) {
      case 'New':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Reviewed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Converted':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Spam':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  },

  /**
   * Task priority badge styling
   */
  getPriorityBadgeClass(priority) {
    if (priority === 'High') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (priority === 'Medium') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  },

  /**
   * XSS-safe Global Toast Notification System with SVG Icons
   */
  toast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const styles = {
      success: {
        bg: 'bg-slate-900 text-white border-slate-800',
        iconColor: 'text-emerald-400',
        path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
      },
      error: {
        bg: 'bg-rose-600 text-white border-rose-700',
        iconColor: 'text-rose-100',
        path: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
      },
      warning: {
        bg: 'bg-amber-600 text-white border-amber-700',
        iconColor: 'text-amber-100',
        path: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
      },
      info: {
        bg: 'bg-slate-800 text-white border-slate-700',
        iconColor: 'text-indigo-300',
        path: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
      }
    };

    const cfg = styles[type] || styles.info;
    const el = document.createElement('div');
    el.setAttribute('role', 'status');
    el.className = `pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium transition-all duration-300 transform translate-y-2 opacity-0 ${cfg.bg}`;

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', `w-4 h-4 shrink-0 ${cfg.iconColor}`);
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('viewBox', '0 0 24 24');
    const pathEl = document.createElementNS(svgNS, 'path');
    pathEl.setAttribute('stroke-linecap', 'round');
    pathEl.setAttribute('stroke-linejoin', 'round');
    pathEl.setAttribute('stroke-width', '2');
    pathEl.setAttribute('d', cfg.path);
    svg.appendChild(pathEl);

    const textSpan = document.createElement('span');
    textSpan.textContent = String(message ?? '');

    el.appendChild(svg);
    el.appendChild(textSpan);
    toastContainer.appendChild(el);

    setTimeout(() => {
      el.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
      el.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => el.remove(), 300);
    }, 3500);
  }
};
