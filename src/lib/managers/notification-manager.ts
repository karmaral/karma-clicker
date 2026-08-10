import { toast } from '@zerodevx/svelte-toast';
import Notification from '$features/notification/Notification.svelte';
import type { ItemTextData } from '$types';

class NotificationManager {
  constructor() {}
  notify(data: ItemTextData) {
    const { title, description } = data;
    toast.push({
      component: {
        src: Notification, 
        props: { title, description },
        sendIdTo: 'toastId',
      },
      pausable: true,
      intro: { x: 0, y: 128 },
    });
  }
}
const manager = new NotificationManager();
export default manager;
