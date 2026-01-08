export const getStatusColor = (status: string) => {
  switch (status) {
    case 'M':
      return 'text-blue-400';
    case 'A':
      return 'text-green-400';
    case 'D':
      return 'text-red-400';
    case 'R':
      return 'text-yellow-400';
    default:
      return 'opacity-60';
  }
};

export const getStatusText = (status: string) => {
  switch (status) {
    case 'M':
      return 'Modified';
    case 'A':
      return 'Added';
    case 'D':
      return 'Deleted';
    case 'R':
      return 'Renamed';
    default:
      return 'Unknown';
  }
};
